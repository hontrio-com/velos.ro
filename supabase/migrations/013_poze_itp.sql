-- =========================================================
-- Migration 013: poze ITP pe programare, stocate in Cloudflare R2
--
-- Inspectorii fac poze in timpul inspectiei (camera telefonului sau upload).
-- Fisierele stau in Cloudflare R2 (bucket privat, jurisdictie UE); aici tinem
-- doar metadatele. Pozele se sterg automat dupa descarcarea arhivei ZIP sau
-- la 14 zile de la incarcare.
--
-- 1. programari_poze - un rand per poza. La descarcare / expirare / stergere
--    manuala randul NU se sterge fizic: se marcheaza (sters_la,
--    motiv_stergere), ca sertarul sa poata afisa "Pozele au fost descarcate
--    pe ...". Accesul se face EXCLUSIV prin service role, din server actions
--    care verifica programarea: RLS activ, fara politici, fara drepturi pentru
--    anon/authenticated. O politica de tip user_owns_statie(statie_id) ar
--    permite unui utilizator sa insereze cheia R2 a altei statii si sa
--    primeasca pentru ea un URL semnat (citirea pozelor altui client).
--    CHECK-urile de mai jos garanteaza si in baza de date ca o cheie R2 se
--    afla in "folderul" exact itp/<statie>/<programare>/.
--
-- 2. r2_chei_de_sters - coada ("outbox") de obiecte R2 de sters. Se umple
--    AUTOMAT din trigger, in ACEEASI tranzactie cu:
--      - marcarea ca sters (sters_la NULL -> NOT NULL);
--      - stergerea fizica a unui rand inca activ: cascadele de la stergerea
--        programarii, a vehiculului, a statiei, a contului si stergerile
--        manuale din dashboard, unde codul aplicatiei nu apuca sa citeasca
--        cheile.
--    Aplicatia sterge din R2 imediat (best effort), iar cron-ul zilnic
--    /api/cron/poze-itp goleste ce a ramas. Daca R2 nu raspunde, cheile
--    raman in coada pana la rularea urmatoare - nu se pierde nimic.
--
-- 3. poze_incarcari_emise - plafonul zilnic de incarcare per proprietar.
--    Fiecare URL de incarcare emis rezerva aici marimea semnata a fisierelor
--    (rezerva_incarcare_poze), deci si incarcarile niciodata confirmate sunt
--    numarate: un cont nu poate umple R2 cerand URL-uri la nesfarsit.
--
-- ATENTIE: nu adaugati un PRIMARY KEY / UNIQUE care sa contina
-- (programare_id, statie_id): PostgREST ar vedea tabela ca "junction" intre
-- programari si statii, iar embed-urile existente programari -> statii ar
-- deveni ambigue (eroare PGRST201).
--
-- Plasa de siguranta in R2: regula de lifecycle pe prefixul "itp/" la 15 zile
-- (se seteaza din Cloudflare) - prinde si incarcarile neconfirmate.
--
-- Se ruleaza INTEGRAL, intr-o singura tranzactie (apply_migration sau SQL
-- Editor cu tot fisierul odata) - altfel SET LOCAL de mai jos nu are efect.
-- Idempotenta: poate fi rulata de mai multe ori. Daca pica cu "lock timeout"
-- (SQLSTATE 55P03), o sesiune tine blocate programari / statii / profiles:
-- se gaseste in pg_stat_activity ('idle in transaction'), se inchide, apoi
-- se ruleaza din nou.
-- =========================================================

-- Cheile straine de mai jos blocheaza scurt programari, statii si profiles.
-- Nu asteptam la nesfarsit dupa lock-uri pe tabele folosite in productie:
-- daca nu se obtine lock-ul in 5 secunde, migratia pica integral si se reia.
SET LOCAL lock_timeout = '5s';

-- 1. Tabela pozelor ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.programari_poze (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  programare_id   uuid NOT NULL,
  statie_id       uuid NOT NULL,
  r2_key          text NOT NULL,
  r2_key_thumb    text,
  mime            text NOT NULL DEFAULT 'image/jpeg',
  marime_bytes    integer NOT NULL,
  latime          integer,
  inaltime        integer,
  facuta_la       timestamptz,
  incarcata_la    timestamptz NOT NULL DEFAULT now(),
  incarcata_de    uuid,
  expira_la       timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  sters_la        timestamptz,
  motiv_stergere  text,
  sters_de        uuid,

  CONSTRAINT programari_poze_programare_id_fkey
    FOREIGN KEY (programare_id) REFERENCES public.programari(id) ON DELETE CASCADE,
  CONSTRAINT programari_poze_statie_id_fkey
    FOREIGN KEY (statie_id) REFERENCES public.statii(id) ON DELETE CASCADE,
  CONSTRAINT programari_poze_incarcata_de_fkey
    FOREIGN KEY (incarcata_de) REFERENCES public.profiles(id) ON DELETE SET NULL,
  CONSTRAINT programari_poze_sters_de_fkey
    FOREIGN KEY (sters_de) REFERENCES public.profiles(id) ON DELETE SET NULL,

  CONSTRAINT programari_poze_r2_key_key UNIQUE (r2_key),

  -- itp/<statie_id>/<programare_id>/<uuid>.jpg - exact folderul acestei programari
  CONSTRAINT programari_poze_cheie_valida CHECK (
    r2_key ~ '^itp/[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}\.jpg$'
    AND starts_with(r2_key, 'itp/' || statie_id::text || '/' || programare_id::text || '/')
  ),
  -- miniatura: aceeasi cheie cu sufixul _t
  CONSTRAINT programari_poze_thumb_valida CHECK (
    r2_key_thumb IS NULL
    OR r2_key_thumb = left(r2_key, length(r2_key) - 4) || '_t.jpg'
  ),
  CONSTRAINT programari_poze_mime_valid CHECK (mime = 'image/jpeg'),
  CONSTRAINT programari_poze_marime_valida CHECK (marime_bytes > 0 AND marime_bytes <= 8388608),
  CONSTRAINT programari_poze_dimensiuni_valide CHECK (
    (latime IS NULL OR latime > 0) AND (inaltime IS NULL OR inaltime > 0)
  ),
  CONSTRAINT programari_poze_motiv_valid CHECK (
    motiv_stergere IN ('descarcat', 'expirat', 'manual')
  ),
  CONSTRAINT programari_poze_stergere_completa CHECK (
    (sters_la IS NULL) = (motiv_stergere IS NULL)
  )
);

-- Index complet (nu partial) pe programare: il folosesc lista pozelor active,
-- rezumatul pozelor sterse si cascada ON DELETE din programari (fara filtru pe
-- sters_la); randurile marcate ca sterse raman in tabela.
CREATE INDEX IF NOT EXISTS idx_programari_poze_programare
  ON public.programari_poze (programare_id);
-- Cascada la stergerea unei statii.
CREATE INDEX IF NOT EXISTS idx_programari_poze_statie
  ON public.programari_poze (statie_id);
-- Cron-ul de expirare.
CREATE INDEX IF NOT EXISTS idx_programari_poze_expirare
  ON public.programari_poze (expira_la)
  WHERE sters_la IS NULL;

COMMENT ON TABLE public.programari_poze IS
  'Poze ITP pe programare (metadate; fisierele sunt in Cloudflare R2). Acces doar prin service role, din server actions.';

-- 2. Coada de stergere R2 ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.r2_chei_de_sters (
  cheie          text PRIMARY KEY,
  creat_la       timestamptz NOT NULL DEFAULT now(),
  incercari      integer NOT NULL DEFAULT 0,
  ultima_eroare  text
);

COMMENT ON TABLE public.r2_chei_de_sters IS
  'Obiecte R2 de sters (outbox). Umpluta de trigger, golita de aplicatie si de /api/cron/poze-itp.';

-- 2b. Plafonul zilnic de incarcare (per proprietarul statiei) ---------------
-- Un rand per proprietar si zi (data calendaristica in Romania): octetii
-- semnati in URL-urile de incarcare emise in ziua respectiva. Fara cheie
-- straina (nu blocam profiles; randurile vechi le sterge cron-ul).
CREATE TABLE IF NOT EXISTS public.poze_incarcari_emise (
  owner_id       uuid NOT NULL,
  zi             date NOT NULL,
  octeti         bigint NOT NULL DEFAULT 0,
  actualizat_la  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT poze_incarcari_emise_pkey PRIMARY KEY (owner_id, zi),
  CONSTRAINT poze_incarcari_emise_octeti_valid CHECK (octeti >= 0)
);

COMMENT ON TABLE public.poze_incarcari_emise IS
  'Octeti de poze ITP pentru care s-au emis URL-uri de incarcare, per proprietar si zi (plafon zilnic). Doar service role.';

-- 3. RLS + drepturi: doar service role --------------------------------------
-- Fara politici = niciun rand pentru anon/authenticated. In plus retragem si
-- drepturile de tabela (pe acest proiect, tabelele noi din public primesc
-- implicit toate drepturile pentru anon/authenticated - pg_default_acl).
ALTER TABLE public.programari_poze ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.r2_chei_de_sters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poze_incarcari_emise ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.programari_poze FROM anon, authenticated;
REVOKE ALL ON TABLE public.r2_chei_de_sters FROM anon, authenticated;
REVOKE ALL ON TABLE public.poze_incarcari_emise FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.programari_poze TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.r2_chei_de_sters TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.poze_incarcari_emise TO service_role;

-- 4. Trigger: cheile pozelor sterse intra in coada ---------------------------
-- SECURITY DEFINER: inserarea in coada trebuie sa mearga si in cascadele
-- rulate de Postgres in numele altor roluri (ex. stergerea contului din Auth).
-- Functiile de trigger nu pot fi apelate direct; REVOKE e doar aparare in plus.
CREATE OR REPLACE FUNCTION public.programari_poze_chei_in_coada()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
BEGIN
  INSERT INTO public.r2_chei_de_sters (cheie)
  SELECT k
  FROM unnest(ARRAY[OLD.r2_key, OLD.r2_key_thumb]) AS k
  WHERE k IS NOT NULL
  ON CONFLICT (cheie) DO NOTHING;
  RETURN NULL;
END;
$func$;

REVOKE ALL ON FUNCTION public.programari_poze_chei_in_coada() FROM PUBLIC, anon, authenticated;

-- Marcare ca stearsa (descarcare / expirare / manual).
DROP TRIGGER IF EXISTS programari_poze_coada_la_marcare ON public.programari_poze;
CREATE TRIGGER programari_poze_coada_la_marcare
  AFTER UPDATE OF sters_la ON public.programari_poze
  FOR EACH ROW
  WHEN (OLD.sters_la IS NULL AND NEW.sters_la IS NOT NULL)
  EXECUTE FUNCTION public.programari_poze_chei_in_coada();

-- Stergere fizica a unui rand inca activ (cascade, dashboard). Randurile deja
-- marcate si-au pus cheile in coada la marcare.
DROP TRIGGER IF EXISTS programari_poze_coada_la_stergere ON public.programari_poze;
CREATE TRIGGER programari_poze_coada_la_stergere
  AFTER DELETE ON public.programari_poze
  FOR EACH ROW
  WHEN (OLD.sters_la IS NULL)
  EXECUTE FUNCTION public.programari_poze_chei_in_coada();

-- 5. Trigger: invariantii de care depinde curatarea R2 -----------------------
-- (a) cheile si programarea unei poze nu se schimba dupa inserare;
-- (b) o poza marcata ca stearsa nu poate fi "reactivata" - obiectul ei R2 este
--     deja in coada de stergere, deci randul ar arata spre un fisier disparut.
-- Protejeaza mai ales impotriva editarilor manuale din dashboard.
CREATE OR REPLACE FUNCTION public.programari_poze_verifica_modificare()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $func$
BEGIN
  IF NEW.r2_key IS DISTINCT FROM OLD.r2_key
     OR NEW.r2_key_thumb IS DISTINCT FROM OLD.r2_key_thumb
     OR NEW.programare_id IS DISTINCT FROM OLD.programare_id
     OR NEW.statie_id IS DISTINCT FROM OLD.statie_id THEN
    RAISE EXCEPTION 'programari_poze: cheile R2 si programarea unei poze nu se modifica';
  END IF;
  IF OLD.sters_la IS NOT NULL AND NEW.sters_la IS NULL THEN
    RAISE EXCEPTION 'programari_poze: o poza stearsa nu poate fi reactivata';
  END IF;
  RETURN NEW;
END;
$func$;

REVOKE ALL ON FUNCTION public.programari_poze_verifica_modificare() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS programari_poze_imutabil ON public.programari_poze;
CREATE TRIGGER programari_poze_imutabil
  BEFORE UPDATE OF r2_key, r2_key_thumb, programare_id, statie_id, sters_la
  ON public.programari_poze
  FOR EACH ROW
  EXECUTE FUNCTION public.programari_poze_verifica_modificare();

-- 6. Rezervarea ATOMICA din plafonul zilnic de incarcare ---------------------
-- Apelata de pregatesteIncarcarePozeAction INAINTE sa emita URL-urile de
-- incarcare. true = rezervat (URL-urile se pot emite); false = plafonul zilei
-- ar fi depasit, nu se rezerva nimic. INSERT ... ON CONFLICT DO UPDATE ... WHERE
-- e atomic: apelurile simultane pentru acelasi proprietar se serializeaza pe
-- rand si nu pot depasi plafonul impreuna.
CREATE OR REPLACE FUNCTION public.rezerva_incarcare_poze(
  p_owner_id uuid,
  p_octeti bigint,
  p_max_octeti bigint
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_zi date := (now() AT TIME ZONE 'Europe/Bucharest')::date;
  v_ok boolean;
BEGIN
  IF p_owner_id IS NULL OR p_octeti IS NULL OR p_octeti < 1
     OR p_max_octeti IS NULL OR p_max_octeti < 1 THEN
    RAISE EXCEPTION 'rezerva_incarcare_poze: parametri invalizi (proprietar %, octeti %, plafon %)',
      p_owner_id, p_octeti, p_max_octeti;
  END IF;

  IF p_octeti > p_max_octeti THEN
    RETURN false;
  END IF;

  INSERT INTO public.poze_incarcari_emise AS e (owner_id, zi, octeti)
  VALUES (p_owner_id, v_zi, p_octeti)
  ON CONFLICT (owner_id, zi) DO UPDATE
    SET octeti = e.octeti + EXCLUDED.octeti,
        actualizat_la = now()
    WHERE e.octeti + EXCLUDED.octeti <= p_max_octeti
  RETURNING true INTO v_ok;

  RETURN COALESCE(v_ok, false);
END;
$func$;

REVOKE EXECUTE ON FUNCTION public.rezerva_incarcare_poze(uuid, bigint, bigint) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rezerva_incarcare_poze(uuid, bigint, bigint) TO service_role;

-- 7. PostgREST vede imediat tabelele si functia noi --------------------------
NOTIFY pgrst, 'reload schema';

-- Verificare rapida dupa aplicare -------------------------------------------
--
--   SELECT relname, relrowsecurity FROM pg_class
--   WHERE relname IN ('programari_poze', 'r2_chei_de_sters', 'poze_incarcari_emise');
--   -- asteptat: relrowsecurity = true pentru toate trei
--
--   SELECT grantee, privilege_type FROM information_schema.role_table_grants
--   WHERE table_name IN ('programari_poze', 'r2_chei_de_sters', 'poze_incarcari_emise')
--     AND grantee IN ('anon', 'authenticated');
--   -- asteptat: 0 randuri
--
--   SELECT has_function_privilege('authenticated',
--     'public.rezerva_incarcare_poze(uuid, bigint, bigint)', 'EXECUTE');
--   -- asteptat: false
--
--   SELECT tgname FROM pg_trigger
--   WHERE tgrelid = 'public.programari_poze'::regclass AND NOT tgisinternal;
--   -- asteptat: programari_poze_coada_la_marcare, programari_poze_coada_la_stergere,
--   --           programari_poze_imutabil
--
--   -- Coada blocata (chei care tot esueaza):
--   SELECT cheie, incercari, ultima_eroare FROM r2_chei_de_sters
--   WHERE incercari >= 3 ORDER BY incercari DESC LIMIT 20;
