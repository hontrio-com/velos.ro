-- =========================================================
-- Migration 012: trial gratuit 6 luni FARA SMS incluse (doar conturi noi)
--
-- De la lansare (20.10.2026), conturile NOI primesc o perioada de proba de
-- admin_settings.trial_luni luni (implicit 6) FARA SMS-uri incluse: SMS-urile
-- se trimit doar din creditul cumparat (profiles.sms_credit).
-- Conturile EXISTENTE nu se schimba: trialul vechi (trial_zile / 20 SMS)
-- ramane exact cum este, la fel planurile platite.
--
-- Ce face:
--  0. Verificari: schema live are tot ce presupune migratia (altfel se opreste).
--  1. profiles.trial_fara_sms boolean NOT NULL DEFAULT false = marcajul de
--     cohorta. Toate randurile existente primesc false.
--  2. set_trial_expires_at() (functia triggerului live trg_set_trial_expires_at,
--     BEFORE INSERT ON profiles): un profil NOU primeste
--     trial_expires_at = now() + trial_luni luni si trial_fara_sms = true.
--     Un upsert pe un profil care exista deja (createContAngajatAction) nu mai
--     este atins, deci angajatul pastreaza data trimisa de aplicatie.
--  3. get_sms_quota(): aceeasi semnatura, acelasi rezultat pentru toate
--     conturile existente; o singura ramura noua: plan = 'trial' si
--     trial_fara_sms => 0 SMS incluse (luna calendaristica curenta).
--  4. Fara SMS-uri gratuite pe ocolite: increment_sms_quota doar pentru
--     service_role, utilizatorii nu mai pot scrie direct in sms_quota,
--     CHECK sms_trimise >= 0.
--  5. consuma_credit_sms(): scaderea ATOMICA a creditului (doar service_role);
--     restituie_credit_sms(): creditul rezervat se da inapoi daca SMS-ul nu a
--     plecat (doar service_role).
--  6. adauga_credit_sms_achizitie(): creditarea IDEMPOTENTA a unei achizitii
--     Stripe, o singura data per stripe_session_id (doar service_role).
--  7. admin_settings: cheie noua trial_luni = '6'; descrieri noi pentru
--     trial_zile si trial_sms_limita (VALORILE lor nu se schimba).
--  8. NOTIFY pgrst: coloana si functiile noi sunt vazute imediat de API.
--
-- NU modifica: handle_new_user, valorile trial_zile / trial_sms_limita,
-- randurile existente din profiles, sms_quota, sms_purchases.
-- Idempotenta: se poate rula din nou fara efecte nedorite.
-- Se ruleaza INTEGRAL, intr-o singura tranzactie (apply_migration sau
-- SQL Editor cu tot fisierul odata). Rollback: blocul comentat de la final.
-- =========================================================

-- Nu asteptam la nesfarsit dupa lock-uri pe tabele folosite in productie:
-- daca nu se obtine lock-ul in 5 secunde, migratia pica integral si se reia.
SET LOCAL lock_timeout = '5s';

-- -- 0. Verificari (se opreste cu mesaj clar daca schema live e alta) -------
DO $func$
DECLARE
  v_lipsa text;
  v_src   text;
  v_tip   text;
  r record;
BEGIN
  SELECT string_agg(c, ', ') INTO v_lipsa
  FROM unnest(ARRAY['role', 'plan', 'sms_credit', 'trial_expires_at', 'subscription_status']) AS c
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = c
  );
  IF v_lipsa IS NOT NULL THEN
    RAISE EXCEPTION '[012] Lipsesc coloane in public.profiles: %', v_lipsa;
  END IF;

  SELECT data_type INTO v_tip
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'trial_fara_sms';
  IF v_tip IS NOT NULL AND v_tip <> 'boolean' THEN
    RAISE EXCEPTION '[012] profiles.trial_fara_sms exista deja cu tipul % (asteptat boolean).', v_tip;
  END IF;

  IF to_regprocedure('public.set_trial_expires_at()') IS NULL
     OR NOT EXISTS (
       SELECT 1 FROM pg_trigger
       WHERE tgrelid = 'public.profiles'::regclass
         AND tgname = 'trg_set_trial_expires_at'
         AND tgfoid = 'public.set_trial_expires_at()'::regprocedure
         AND NOT tgisinternal
     ) THEN
    RAISE EXCEPTION '[012] Lipseste triggerul trg_set_trial_expires_at -> set_trial_expires_at() pe public.profiles.';
  END IF;

  IF to_regprocedure('public.get_sms_quota(uuid)') IS NULL
     OR to_regprocedure('public.increment_sms_quota(uuid, integer)') IS NULL THEN
    RAISE EXCEPTION '[012] Lipseste get_sms_quota(uuid) sau increment_sms_quota(uuid, integer).';
  END IF;

  -- Pasii 2 si 3 inlocuiesc corpurile live. Daca acestea s-au schimbat fata de
  -- versiunea pe care se bazeaza migratia (fix_sms_quota_limits / 011), ne oprim:
  -- altfel am suprascrie o modificare necunoscuta. A doua rulare (corpurile deja
  -- contin trial_fara_sms / trial_luni) trece.
  SELECT prosrc INTO v_src FROM pg_proc WHERE oid = 'public.get_sms_quota(uuid)'::regprocedure;
  IF v_src NOT LIKE '%trial_fara_sms%' AND NOT (
         v_src LIKE '%trial_sms_limita%'
     AND v_src LIKE '%THEN 250%'
     AND v_src LIKE '%THEN 500%'
     AND v_src LIKE '%THEN 1000%'
     AND v_src LIKE '%14 days%'
  ) THEN
    RAISE EXCEPTION '[012] get_sms_quota live difera de versiunea asteptata. Compara corpul (pg_get_functiondef) cu pasul 3 inainte de a continua.';
  END IF;

  SELECT prosrc INTO v_src FROM pg_proc WHERE oid = 'public.set_trial_expires_at()'::regprocedure;
  IF v_src NOT LIKE '%trial_luni%' AND v_src NOT LIKE '%trial_zile%' THEN
    RAISE EXCEPTION '[012] set_trial_expires_at live difera de versiunea asteptata. Compara corpul cu pasul 2 inainte de a continua.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_index i
    JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = i.indkey[0]
    WHERE i.indrelid = 'public.sms_purchases'::regclass
      AND i.indisunique
      AND i.indnkeyatts = 1
      AND i.indpred IS NULL
      AND i.indexprs IS NULL
      AND a.attname = 'stripe_session_id'
  ) THEN
    RAISE EXCEPTION '[012] Lipseste indexul/constrangerea UNIQUE pe sms_purchases(stripe_session_id).';
  END IF;

  -- Utilizatorii nu au voie sa-si modifice singuri coloanele de facturare
  -- (migratia 008). Coloana noua nu primeste niciun drept de UPDATE, dar daca
  -- exista UPDATE la nivel de tabel, ar putea s-o modifice => ne oprim.
  IF has_table_privilege('authenticated', 'public.profiles', 'UPDATE')
     OR has_table_privilege('anon', 'public.profiles', 'UPDATE') THEN
    RAISE EXCEPTION '[012] anon/authenticated au UPDATE pe tot tabelul profiles. Aplica intai 008_securitate.sql.';
  END IF;

  FOR r IN
    SELECT tgname FROM pg_trigger
    WHERE tgrelid = 'public.profiles'::regclass
      AND NOT tgisinternal
      AND tgname NOT IN ('trg_set_trial_expires_at', 'profiles_updated_at')
  LOOP
    RAISE WARNING '[012] Trigger necunoscut pe profiles: % - verifica daca rescrie trial_expires_at.', r.tgname;
  END LOOP;
END
$func$;

-- -- 1. Marcajul de cohorta ------------------------------------------------
-- DEFAULT false: TOATE randurile existente primesc false (regimul vechi ramane).
-- Doar functia de la pasul 2 pune true, si doar pe profilurile noi.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS trial_fara_sms boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.trial_fara_sms IS
  'true = cont creat cu trialul nou (6 luni, fara SMS incluse; migratia 012). Cat timp plan = trial, contul trimite SMS doar din sms_credit.';

-- -- 2. Conturile noi: trial de trial_luni luni, fara SMS incluse ----------
-- Inlocuieste corpul functiei triggerului live trg_set_trial_expires_at
-- (care folosea trial_zile). Triggerul ramane acelasi.
CREATE OR REPLACE FUNCTION public.set_trial_expires_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_text text;
  v_luni integer := 6;
BEGIN
  -- INSERT ... ON CONFLICT DO UPDATE pe un profil care exista deja (ex. upsert-ul
  -- din createContAngajatAction): nu e un cont nou. Fara aceasta verificare,
  -- valorile setate aici ar ajunge in EXCLUDED si ar suprascrie randul existent.
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    RETURN NEW;
  END IF;

  -- Citire defensiva: orice problema cu setarea => 6 luni. O eroare aici ar
  -- bloca TOATE inregistrarile (handle_new_user ar esua).
  BEGIN
    SELECT btrim(valoare) INTO v_text
    FROM public.admin_settings
    WHERE cheie = 'trial_luni';

    IF v_text ~ '^[0-9]{1,2}$' THEN
      v_luni := v_text::integer;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_luni := 6;
  END;

  IF v_luni < 1 OR v_luni > 24 THEN
    v_luni := 6;
  END IF;

  NEW.trial_expires_at := now() + make_interval(months => v_luni);
  NEW.trial_fara_sms := true;
  RETURN NEW;
END;
$func$;

-- Functie de trigger: nu se apeleaza direct. postgres si service_role (cei care
-- insereaza in profiles) isi pastreaza dreptul.
REVOKE EXECUTE ON FUNCTION public.set_trial_expires_at() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_trial_expires_at() TO service_role;

-- -- 3. get_sms_quota: 0 SMS incluse pentru trialul nou ---------------------
-- Corpul live copiat EXACT; singura diferenta este ramura
-- "plan = 'trial' AND trial_fara_sms" (+ SET search_path). Aceeasi semnatura
-- si acelasi tip de retur => CREATE OR REPLACE pastreaza drepturile existente.
CREATE OR REPLACE FUNCTION public.get_sms_quota(p_profile_id uuid)
 RETURNS TABLE(trimise integer, limita integer, ramase integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $func$
DECLARE
  v_plan        text;
  v_trial_exp   timestamptz;
  v_fara_sms    boolean;
  v_limita      int;
  v_luna        date;
  v_trial_limit int;
BEGIN
  SELECT plan, trial_expires_at, trial_fara_sms INTO v_plan, v_trial_exp, v_fara_sms
  FROM profiles WHERE id = p_profile_id;

  IF v_plan = 'trial' AND COALESCE(v_fara_sms, false) THEN
    -- Trialul nou (conturi create dupa lansare): fara SMS incluse.
    v_luna   := date_trunc('month', CURRENT_DATE)::date;
    v_limita := 0;
  ELSIF v_plan = 'trial' THEN
    SELECT valoare::int INTO v_trial_limit
    FROM admin_settings WHERE cheie = 'trial_sms_limita';
    v_trial_limit := COALESCE(v_trial_limit, 20);
    v_luna   := date_trunc('month', v_trial_exp - INTERVAL '14 days')::date;
    v_limita := CASE WHEN NOW() <= v_trial_exp THEN v_trial_limit ELSE 0 END;
  ELSE
    v_luna   := date_trunc('month', CURRENT_DATE)::date;
    v_limita := CASE v_plan
      WHEN 'basic'      THEN 250
      WHEN 'pro'        THEN 500
      WHEN 'enterprise' THEN 1000
      ELSE 0
    END;
  END IF;

  INSERT INTO sms_quota (profile_id, luna, sms_trimise, sms_limita)
  VALUES (p_profile_id, v_luna, 0, v_limita)
  ON CONFLICT (profile_id, luna) DO UPDATE
    SET sms_limita = v_limita;

  RETURN QUERY
  SELECT q.sms_trimise, q.sms_limita, GREATEST(0, q.sms_limita - q.sms_trimise)
  FROM sms_quota q
  WHERE q.profile_id = p_profile_id AND q.luna = v_luna;
END;
$func$;

-- -- 4. Fara SMS-uri gratuite pe ocolite ------------------------------------
-- increment_sms_quota e apelata doar din server (src/lib/sms.ts, service role).
REVOKE EXECUTE ON FUNCTION public.increment_sms_quota(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_sms_quota(uuid, integer) TO service_role;
ALTER FUNCTION public.increment_sms_quota(uuid, integer) SET search_path = public;

-- Niciun cod din browser nu scrie in sms_quota (doar get_sms_quota, SECURITY
-- DEFINER, si serverul). SELECT ramane.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.sms_quota FROM anon, authenticated;

DO $func$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.sms_quota'::regclass
      AND conname = 'sms_quota_sms_trimise_nenegativ'
  ) THEN
    IF EXISTS (SELECT 1 FROM public.sms_quota WHERE sms_trimise < 0) THEN
      ALTER TABLE public.sms_quota
        ADD CONSTRAINT sms_quota_sms_trimise_nenegativ CHECK (sms_trimise >= 0) NOT VALID;
      RAISE WARNING '[012] sms_quota are randuri cu sms_trimise < 0: constrangerea e NOT VALID (se aplica doar randurilor noi sau modificate). Corecteaza randurile, apoi: ALTER TABLE public.sms_quota VALIDATE CONSTRAINT sms_quota_sms_trimise_nenegativ;';
    ELSE
      ALTER TABLE public.sms_quota
        ADD CONSTRAINT sms_quota_sms_trimise_nenegativ CHECK (sms_trimise >= 0);
    END IF;
  END IF;
END
$func$;

-- -- 5. Scaderea atomica a creditului SMS -----------------------------------
-- Inlocuieste citire -> scriere din sendSms: doua trimiteri simultane, sau o
-- trimitere in paralel cu o creditare, nu mai pierd actualizari.
-- Intoarce creditul ramas sau -1 daca nu ajunge (atunci nu scade nimic).
CREATE OR REPLACE FUNCTION public.consuma_credit_sms(
  p_profile_id uuid,
  p_count integer DEFAULT 1
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_rest integer;
BEGIN
  IF p_profile_id IS NULL OR p_count IS NULL OR p_count < 1 THEN
    RAISE EXCEPTION 'consuma_credit_sms: parametri invalizi (profil %, numar %)', p_profile_id, p_count;
  END IF;

  UPDATE public.profiles
  SET sms_credit = sms_credit - p_count
  WHERE id = p_profile_id
    AND sms_credit >= p_count
  RETURNING sms_credit INTO v_rest;

  RETURN COALESCE(v_rest, -1);
END;
$func$;

REVOKE EXECUTE ON FUNCTION public.consuma_credit_sms(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consuma_credit_sms(uuid, integer) TO service_role;

-- -- 5b. Restituirea creditului rezervat ---------------------------------------
-- sendSms REZERVA creditul (consuma_credit_sms) INAINTE sa trimita SMS-ul, ca
-- trimiterile simultane sa nu poata trimite mai multe SMS-uri decat creditul.
-- Daca SMSO nu accepta mesajul (raspuns de eroare / fara conexiune), creditul
-- rezervat se da inapoi aici. Intoarce creditul nou sau -1 daca profilul nu exista.
CREATE OR REPLACE FUNCTION public.restituie_credit_sms(
  p_profile_id uuid,
  p_count integer DEFAULT 1
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_credit integer;
BEGIN
  IF p_profile_id IS NULL OR p_count IS NULL OR p_count < 1 THEN
    RAISE EXCEPTION 'restituie_credit_sms: parametri invalizi (profil %, numar %)', p_profile_id, p_count;
  END IF;

  UPDATE public.profiles
  SET sms_credit = COALESCE(sms_credit, 0) + p_count
  WHERE id = p_profile_id
  RETURNING sms_credit INTO v_credit;

  RETURN COALESCE(v_credit, -1);
END;
$func$;

REVOKE EXECUTE ON FUNCTION public.restituie_credit_sms(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.restituie_credit_sms(uuid, integer) TO service_role;

-- -- 6. Creditarea idempotenta a unei achizitii Stripe -----------------------
-- Webhook-ul (si reincercarile lui) si fallback-ul paginii de succes
-- (fulfillSmsSessionAction) pot rula in aceeasi secunda pentru aceeasi sesiune.
-- UNIQUE(stripe_session_id) + ON CONFLICT DO NOTHING: un singur apel insereaza,
-- si doar acela creste creditul. true = acest apel a creditat contul.
CREATE OR REPLACE FUNCTION public.adauga_credit_sms_achizitie(
  p_session_id text,
  p_profile_id uuid,
  p_cantitate integer,
  p_pret_total numeric,
  p_payment_intent text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_id uuid;
BEGIN
  IF p_session_id IS NULL OR btrim(p_session_id) = ''
     OR p_profile_id IS NULL
     OR p_cantitate IS NULL OR p_cantitate < 1 THEN
    RAISE EXCEPTION 'adauga_credit_sms_achizitie: parametri invalizi (sesiune %, profil %, cantitate %)',
      p_session_id, p_profile_id, p_cantitate;
  END IF;

  -- Profil inexistent => eroare de cheie straina => apelantul primeste eroare
  -- (webhook-ul raspunde 500 si Stripe reincearca).
  INSERT INTO public.sms_purchases (
    profile_id, stripe_session_id, stripe_payment_intent,
    cantitate, pret_total, status, completed_at
  ) VALUES (
    p_profile_id, p_session_id, p_payment_intent,
    p_cantitate, COALESCE(p_pret_total, 0), 'completed', now()
  )
  ON CONFLICT (stripe_session_id) DO NOTHING
  RETURNING id INTO v_id;

  IF v_id IS NULL THEN
    RETURN false; -- sesiunea era deja inregistrata
  END IF;

  UPDATE public.profiles
  SET sms_credit = sms_credit + p_cantitate
  WHERE id = p_profile_id;

  RETURN true;
END;
$func$;

REVOKE EXECUTE ON FUNCTION public.adauga_credit_sms_achizitie(text, uuid, integer, numeric, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.adauga_credit_sms_achizitie(text, uuid, integer, numeric, text) TO service_role;

-- -- 7. admin_settings: trial_luni + descrieri (valorile existente raman) ---
INSERT INTO public.admin_settings (cheie, valoare, descriere)
VALUES (
  'trial_luni',
  '6',
  'Durata trial-ului pentru conturi noi (luni, între 1 și 24). Conturile noi nu primesc SMS-uri incluse. Se aplică doar conturilor create după modificare.'
)
ON CONFLICT (cheie) DO NOTHING;

UPDATE public.admin_settings
SET descriere = 'Istoric: durata trialului vechi (zile). Doar conturi create înainte de 20.10.2026 (trial vechi). Nu mai este folosită pentru conturi noi (vezi trial_luni).'
WHERE cheie = 'trial_zile';

UPDATE public.admin_settings
SET descriere = 'SMS-uri incluse în trialul vechi. Doar conturi create înainte de 20.10.2026 (trial vechi). Se aplică imediat acestor conturi.'
WHERE cheie = 'trial_sms_limita';

-- -- 8. PostgREST: reincarca schema (coloana + functiile noi) -------------
NOTIFY pgrst, 'reload schema';

-- =========================================================
-- Verificare dupa aplicare (SQL Editor):
--
--   SELECT count(*) FILTER (WHERE trial_fara_sms) AS cohorta_noua, count(*) AS total FROM public.profiles;
--   -- asteptat imediat dupa aplicare: cohorta_noua = 0
--
--   SELECT p.proname, p.proconfig, p.proacl
--   FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
--   WHERE n.nspname = 'public' AND p.proname IN
--     ('set_trial_expires_at', 'get_sms_quota', 'increment_sms_quota', 'consuma_credit_sms',
--      'restituie_credit_sms', 'adauga_credit_sms_achizitie');
--   -- asteptat: proconfig = {search_path=public} peste tot;
--   --   get_sms_quota: authenticated si service_role (neschimbat);
--   --   celelalte: fara anon / authenticated / "=X" (PUBLIC)
--
--   SELECT has_table_privilege('authenticated', 'public.sms_quota', 'INSERT') AS ins,
--          has_table_privilege('authenticated', 'public.sms_quota', 'UPDATE') AS upd,
--          has_table_privilege('authenticated', 'public.sms_quota', 'SELECT') AS sel;
--   -- asteptat: false, false, true
--
--   SELECT cheie, valoare, descriere FROM public.admin_settings ORDER BY cheie;
--   -- asteptat: trial_luni = 6; trial_zile / trial_sms_limita cu valorile de dinainte
--
-- Dupa primul cont nou creat:
--   SELECT email, role, plan, trial_fara_sms, trial_expires_at, created_at
--   FROM public.profiles ORDER BY created_at DESC LIMIT 3;
--   -- proprietar nou: trial_fara_sms = true, trial_expires_at ~ created_at + 6 luni
--   -- angajat nou:    trial_expires_at ~ created_at + 10 ani (marcajul e irelevant
--   --                 pentru angajati: SMS-urile se factureaza proprietarului)
--
-- =========================================================
-- ROLLBACK (doar la nevoie; in aceasta ordine). Codul nou functioneaza si dupa.
--
-- -- R1. Conturile NOI revin la trialul vechi (corpul live de dinainte de 012):
-- CREATE OR REPLACE FUNCTION public.set_trial_expires_at()
--  RETURNS trigger
--  LANGUAGE plpgsql
-- AS $func$
-- DECLARE
--   v_zile int;
-- BEGIN
--   SELECT valoare::int INTO v_zile FROM admin_settings WHERE cheie = 'trial_zile';
--   v_zile := COALESCE(v_zile, 15);
--   NEW.trial_expires_at := NOW() + (v_zile || ' days')::interval;
--   RETURN NEW;
-- END;
-- $func$;
--
-- -- R2. OPTIONAL, doar la decizie explicita: conturile deja create in cohorta
-- --     trec la regimul vechi (isi pastreaza data de expirare, primesc SMS-urile
-- --     trialului vechi):
-- -- UPDATE public.profiles SET trial_fara_sms = false WHERE trial_fara_sms;
--
-- get_sms_quota poate ramane asa (pentru trial_fara_sms = false e identica cu
-- cea veche). Coloana, functiile noi si drepturile revocate pot ramane: codul
-- vechi nu le foloseste. NU sterge coloana trial_fara_sms cat timp
-- set_trial_expires_at o seteaza (pasul R1 intai), altfel pica orice inregistrare.
-- =========================================================
