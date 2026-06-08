-- Fix genereaza_remindere_zilnice: use date ranges instead of exact matching,
-- add 15_zile and expirat tip support
-- Already applied directly to production DB on 2026-06-08

DROP FUNCTION IF EXISTS genereaza_remindere_zilnice(uuid);

CREATE OR REPLACE FUNCTION genereaza_remindere_zilnice(p_statie_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  today DATE := CURRENT_DATE;
  cnt_30z INT := 0;
  cnt_15z INT := 0;
  cnt_7z  INT := 0;
  cnt_1z  INT := 0;
  cnt_exp INT := 0;
  cnt_azi INT := 0;
BEGIN
  -- ITP 30 zile (expira in 25-30 zile)
  WITH ins AS (
    INSERT INTO remindere (statie_id, vehicul_id, client_id, tip, canal, data_trimitere, programat_la, status, mesaj)
    SELECT
      v.statie_id, v.id, v.client_id,
      '30_zile'::tip_reminder, 'sms'::canal_comunicare,
      today, NOW(), 'pending', 'pending_template'
    FROM vehicule v
    JOIN clienti c ON c.id = v.client_id
    WHERE
      (p_statie_id IS NULL OR v.statie_id = p_statie_id)
      AND v.expirare_itp BETWEEN today + INTERVAL '25 days' AND today + INTERVAL '30 days'
      AND c.sms_optin = true
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
    SELECT
      v.statie_id, v.id, v.client_id,
      '15_zile'::tip_reminder, 'sms'::canal_comunicare,
      today, NOW(), 'pending', 'pending_template'
    FROM vehicule v
    JOIN clienti c ON c.id = v.client_id
    WHERE
      (p_statie_id IS NULL OR v.statie_id = p_statie_id)
      AND v.expirare_itp BETWEEN today + INTERVAL '12 days' AND today + INTERVAL '15 days'
      AND c.sms_optin = true
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
    SELECT
      v.statie_id, v.id, v.client_id,
      '7_zile'::tip_reminder, 'sms'::canal_comunicare,
      today, NOW(), 'pending', 'pending_template'
    FROM vehicule v
    JOIN clienti c ON c.id = v.client_id
    WHERE
      (p_statie_id IS NULL OR v.statie_id = p_statie_id)
      AND v.expirare_itp BETWEEN today + INTERVAL '5 days' AND today + INTERVAL '7 days'
      AND c.sms_optin = true
      AND NOT EXISTS (
        SELECT 1 FROM remindere r
        WHERE r.vehicul_id = v.id AND r.tip = '7_zile'
          AND r.created_at > NOW() - INTERVAL '5 days'
          AND r.status IN ('trimis', 'pending')
      )
    RETURNING id
  )
  SELECT COUNT(*) INTO cnt_7z FROM ins;

  -- ITP 1 zi (expira azi sau maine)
  WITH ins AS (
    INSERT INTO remindere (statie_id, vehicul_id, client_id, tip, canal, data_trimitere, programat_la, status, mesaj)
    SELECT
      v.statie_id, v.id, v.client_id,
      '1_zi'::tip_reminder, 'sms'::canal_comunicare,
      today, NOW(), 'pending', 'pending_template'
    FROM vehicule v
    JOIN clienti c ON c.id = v.client_id
    WHERE
      (p_statie_id IS NULL OR v.statie_id = p_statie_id)
      AND v.expirare_itp BETWEEN today AND today + INTERVAL '1 day'
      AND c.sms_optin = true
      AND NOT EXISTS (
        SELECT 1 FROM remindere r
        WHERE r.vehicul_id = v.id AND r.tip = '1_zi'
          AND r.created_at > NOW() - INTERVAL '12 hours'
          AND r.status IN ('trimis', 'pending')
      )
    RETURNING id
  )
  SELECT COUNT(*) INTO cnt_1z FROM ins;

  -- ITP EXPIRAT (expirat in ultimele 7 zile)
  WITH ins AS (
    INSERT INTO remindere (statie_id, vehicul_id, client_id, tip, canal, data_trimitere, programat_la, status, mesaj)
    SELECT
      v.statie_id, v.id, v.client_id,
      'expirat'::tip_reminder, 'sms'::canal_comunicare,
      today, NOW(), 'pending', 'pending_template'
    FROM vehicule v
    JOIN clienti c ON c.id = v.client_id
    WHERE
      (p_statie_id IS NULL OR v.statie_id = p_statie_id)
      AND v.expirare_itp BETWEEN today - INTERVAL '7 days' AND today - INTERVAL '1 day'
      AND c.sms_optin = true
      AND NOT EXISTS (
        SELECT 1 FROM remindere r
        WHERE r.vehicul_id = v.id AND r.tip = 'expirat'
          AND r.created_at > NOW() - INTERVAL '7 days'
          AND r.status IN ('trimis', 'pending')
      )
    RETURNING id
  )
  SELECT COUNT(*) INTO cnt_exp FROM ins;

  -- Ziua programarii (2h inainte)
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
    WHERE
      (p_statie_id IS NULL OR p.statie_id = p_statie_id)
      AND p.data_programare = today
      AND p.status IN ('programat', 'in_lucru')
      AND c.sms_optin = true
      AND NOT EXISTS (
        SELECT 1 FROM remindere r
        WHERE r.programare_id = p.id AND r.tip = 'ziua_programarii'
      )
    RETURNING id
  )
  SELECT COUNT(*) INTO cnt_azi FROM ins;

  RETURN jsonb_build_object(
    'itp_30z', cnt_30z,
    'itp_15z', cnt_15z,
    'itp_7z', cnt_7z,
    'itp_1z', cnt_1z,
    'itp_expirat', cnt_exp,
    'ziua_programarii', cnt_azi,
    'total', cnt_30z + cnt_15z + cnt_7z + cnt_1z + cnt_exp + cnt_azi
  );
END;
$$;
