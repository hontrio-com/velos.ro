-- =========================================================
-- Migration 007 (PARTEA 2 din 2): reminder la 3 zile + generatorul respecta
-- setarile statiei.
--
-- Doua schimbari:
--
-- 1. Tip nou de reminder: "3_zile" (ITP expira in 2-3 zile). Pentru conturile
--    NOI este singurul reminder ITP activ implicit — volumul de SMS-uri era
--    principalul motiv de depasire a quotei.
--
-- 2. genereaza_remindere_zilnice IGNORA pana acum complet comutatoarele din
--    setari_statie: trimitea 30/15/7/1/expirat pentru orice statie, chiar daca
--    proprietarul le oprise din interfata. De acum fiecare tip este generat doar
--    daca este activat pentru statia respectiva.
--
-- Conturile existente raman cu comportamentul lor de pana acum (vezi backfill).
-- =========================================================

-- ── 1. Coloane noi in setari_statie ──────────────────────────────────────────
-- Valorile DEFAULT se aplica randurilor NOI (conturi noi): doar reminderul la
-- 3 zile este pornit.
ALTER TABLE setari_statie
  ADD COLUMN IF NOT EXISTS reminder_3_zile   boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS reminder_15_zile  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminder_expirat  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS template_itp_3_zile text;

-- Conturile noi: reminderele ITP lungi sunt oprite implicit.
ALTER TABLE setari_statie
  ALTER COLUMN reminder_30_zile SET DEFAULT false,
  ALTER COLUMN reminder_7_zile  SET DEFAULT false,
  ALTER COLUMN reminder_1_zi    SET DEFAULT false;

-- ── 2. Backfill: conturile existente pastreaza comportamentul actual ─────────
-- Pana acum generatorul trimitea 15_zile si expirat pentru toata lumea, fara ca
-- proprietarul sa aiba vreun comutator pentru ele — le marcam ca active, ca sa
-- nu se schimbe nimic pentru statiile existente. 30/7/1 pastreaza valoarea deja
-- salvata de proprietar, iar 3_zile ramane oprit (optiune noua, nu o impunem).
UPDATE setari_statie
SET reminder_15_zile = true,
    reminder_expirat = true,
    reminder_3_zile  = false
WHERE created_at < NOW();

-- ── 3. Generatorul respecta setarile ────────────────────────────────────────
DROP FUNCTION IF EXISTS genereaza_remindere_zilnice(uuid);

CREATE OR REPLACE FUNCTION genereaza_remindere_zilnice(p_statie_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  today   DATE := CURRENT_DATE;
  cnt_30z INT := 0;
  cnt_15z INT := 0;
  cnt_7z  INT := 0;
  cnt_3z  INT := 0;
  cnt_1z  INT := 0;
  cnt_exp INT := 0;
  cnt_azi INT := 0;
BEGIN
  -- ITP 30 zile (expira in 25-30 zile)
  WITH ins AS (
    INSERT INTO remindere (statie_id, vehicul_id, client_id, tip, canal, data_trimitere, programat_la, status, mesaj)
    SELECT v.statie_id, v.id, v.client_id,
           '30_zile'::tip_reminder, 'sms'::canal_comunicare,
           today, NOW(), 'pending', 'pending_template'
    FROM vehicule v
    JOIN clienti c ON c.id = v.client_id
    LEFT JOIN setari_statie s ON s.statie_id = v.statie_id
    WHERE (p_statie_id IS NULL OR v.statie_id = p_statie_id)
      AND v.expirare_itp BETWEEN today + INTERVAL '25 days' AND today + INTERVAL '30 days'
      AND c.sms_optin = true
      AND COALESCE(s.reminder_30_zile, true) = true
      AND NOT EXISTS (
        SELECT 1 FROM remindere r
        WHERE r.vehicul_id = v.id AND r.tip = '30_zile'
          AND r.created_at > NOW() - INTERVAL '25 days'
          AND r.status IN ('trimis', 'pending')
      )
    RETURNING id
  )
  SELECT COUNT(*) INTO cnt_30z FROM ins;

  -- ITP 15 zile (expira in 12-15 zile)
  WITH ins AS (
    INSERT INTO remindere (statie_id, vehicul_id, client_id, tip, canal, data_trimitere, programat_la, status, mesaj)
    SELECT v.statie_id, v.id, v.client_id,
           '15_zile'::tip_reminder, 'sms'::canal_comunicare,
           today, NOW(), 'pending', 'pending_template'
    FROM vehicule v
    JOIN clienti c ON c.id = v.client_id
    LEFT JOIN setari_statie s ON s.statie_id = v.statie_id
    WHERE (p_statie_id IS NULL OR v.statie_id = p_statie_id)
      AND v.expirare_itp BETWEEN today + INTERVAL '12 days' AND today + INTERVAL '15 days'
      AND c.sms_optin = true
      AND COALESCE(s.reminder_15_zile, true) = true
      AND NOT EXISTS (
        SELECT 1 FROM remindere r
        WHERE r.vehicul_id = v.id AND r.tip = '15_zile'
          AND r.created_at > NOW() - INTERVAL '10 days'
          AND r.status IN ('trimis', 'pending')
      )
    RETURNING id
  )
  SELECT COUNT(*) INTO cnt_15z FROM ins;

  -- ITP 7 zile (expira in 5-7 zile)
  WITH ins AS (
    INSERT INTO remindere (statie_id, vehicul_id, client_id, tip, canal, data_trimitere, programat_la, status, mesaj)
    SELECT v.statie_id, v.id, v.client_id,
           '7_zile'::tip_reminder, 'sms'::canal_comunicare,
           today, NOW(), 'pending', 'pending_template'
    FROM vehicule v
    JOIN clienti c ON c.id = v.client_id
    LEFT JOIN setari_statie s ON s.statie_id = v.statie_id
    WHERE (p_statie_id IS NULL OR v.statie_id = p_statie_id)
      AND v.expirare_itp BETWEEN today + INTERVAL '5 days' AND today + INTERVAL '7 days'
      AND c.sms_optin = true
      AND COALESCE(s.reminder_7_zile, true) = true
      AND NOT EXISTS (
        SELECT 1 FROM remindere r
        WHERE r.vehicul_id = v.id AND r.tip = '7_zile'
          AND r.created_at > NOW() - INTERVAL '5 days'
          AND r.status IN ('trimis', 'pending')
      )
    RETURNING id
  )
  SELECT COUNT(*) INTO cnt_7z FROM ins;

  -- ITP 3 zile (expira in 2-3 zile) — tip nou
  WITH ins AS (
    INSERT INTO remindere (statie_id, vehicul_id, client_id, tip, canal, data_trimitere, programat_la, status, mesaj)
    SELECT v.statie_id, v.id, v.client_id,
           '3_zile'::tip_reminder, 'sms'::canal_comunicare,
           today, NOW(), 'pending', 'pending_template'
    FROM vehicule v
    JOIN clienti c ON c.id = v.client_id
    LEFT JOIN setari_statie s ON s.statie_id = v.statie_id
    WHERE (p_statie_id IS NULL OR v.statie_id = p_statie_id)
      AND v.expirare_itp BETWEEN today + INTERVAL '2 days' AND today + INTERVAL '3 days'
      AND c.sms_optin = true
      AND COALESCE(s.reminder_3_zile, false) = true
      AND NOT EXISTS (
        SELECT 1 FROM remindere r
        WHERE r.vehicul_id = v.id AND r.tip = '3_zile'
          AND r.created_at > NOW() - INTERVAL '3 days'
          AND r.status IN ('trimis', 'pending')
      )
    RETURNING id
  )
  SELECT COUNT(*) INTO cnt_3z FROM ins;

  -- ITP 1 zi (expira azi sau maine)
  WITH ins AS (
    INSERT INTO remindere (statie_id, vehicul_id, client_id, tip, canal, data_trimitere, programat_la, status, mesaj)
    SELECT v.statie_id, v.id, v.client_id,
           '1_zi'::tip_reminder, 'sms'::canal_comunicare,
           today, NOW(), 'pending', 'pending_template'
    FROM vehicule v
    JOIN clienti c ON c.id = v.client_id
    LEFT JOIN setari_statie s ON s.statie_id = v.statie_id
    WHERE (p_statie_id IS NULL OR v.statie_id = p_statie_id)
      AND v.expirare_itp BETWEEN today AND today + INTERVAL '1 day'
      AND c.sms_optin = true
      AND COALESCE(s.reminder_1_zi, true) = true
      AND NOT EXISTS (
        SELECT 1 FROM remindere r
        WHERE r.vehicul_id = v.id AND r.tip = '1_zi'
          AND r.created_at > NOW() - INTERVAL '2 days'
          AND r.status IN ('trimis', 'pending')
      )
    RETURNING id
  )
  SELECT COUNT(*) INTO cnt_1z FROM ins;

  -- ITP expirat (in ultimele 7 zile)
  WITH ins AS (
    INSERT INTO remindere (statie_id, vehicul_id, client_id, tip, canal, data_trimitere, programat_la, status, mesaj)
    SELECT v.statie_id, v.id, v.client_id,
           'expirat'::tip_reminder, 'sms'::canal_comunicare,
           today, NOW(), 'pending', 'pending_template'
    FROM vehicule v
    JOIN clienti c ON c.id = v.client_id
    LEFT JOIN setari_statie s ON s.statie_id = v.statie_id
    WHERE (p_statie_id IS NULL OR v.statie_id = p_statie_id)
      AND v.expirare_itp BETWEEN today - INTERVAL '7 days' AND today - INTERVAL '1 day'
      AND c.sms_optin = true
      AND COALESCE(s.reminder_expirat, true) = true
      AND NOT EXISTS (
        SELECT 1 FROM remindere r
        WHERE r.vehicul_id = v.id AND r.tip = 'expirat'
          AND r.created_at > NOW() - INTERVAL '7 days'
          AND r.status IN ('trimis', 'pending')
      )
    RETURNING id
  )
  SELECT COUNT(*) INTO cnt_exp FROM ins;

  -- Ziua programarii (2h inainte) — identic cu migratia 005, plus comutatorul
  WITH ins AS (
    INSERT INTO remindere (statie_id, vehicul_id, client_id, programare_id, tip, canal, data_trimitere, programat_la, status, mesaj)
    SELECT
      p.statie_id, p.vehicul_id, p.client_id, p.id,
      'ziua_programarii'::tip_reminder, 'sms'::canal_comunicare,
      today,
      (p.data_programare || ' ' || p.ora_start)::timestamptz - INTERVAL '2 hours',
      'pending', 'pending_template'
    FROM programari p
    JOIN clienti c ON c.id = p.client_id
    LEFT JOIN setari_statie s ON s.statie_id = p.statie_id
    WHERE
      (p_statie_id IS NULL OR p.statie_id = p_statie_id)
      AND p.data_programare = today
      AND p.status IN ('programat', 'in_lucru')
      AND c.sms_optin = true
      AND COALESCE(s.reminder_ziua_programarii, true) = true
      AND NOT EXISTS (
        SELECT 1 FROM remindere r
        WHERE r.programare_id = p.id AND r.tip = 'ziua_programarii'
      )
    RETURNING id
  )
  SELECT COUNT(*) INTO cnt_azi FROM ins;

  -- Cheile pastreaza denumirile din migratia 005 (sunt citite de aplicatie),
  -- cu itp_3z adaugat.
  RETURN jsonb_build_object(
    'itp_30z', cnt_30z,
    'itp_15z', cnt_15z,
    'itp_7z', cnt_7z,
    'itp_3z', cnt_3z,
    'itp_1z', cnt_1z,
    'itp_expirat', cnt_exp,
    'ziua_programarii', cnt_azi,
    'total', cnt_30z + cnt_15z + cnt_7z + cnt_3z + cnt_1z + cnt_exp + cnt_azi
  );
END;
$func$;
