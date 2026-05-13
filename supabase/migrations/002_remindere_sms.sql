-- =========================================================
-- Migration 002: Remindere SMS module
-- =========================================================

-- 1. Extend tip_reminder enum
ALTER TYPE tip_reminder ADD VALUE IF NOT EXISTS 'confirmare_programare';
ALTER TYPE tip_reminder ADD VALUE IF NOT EXISTS 'ziua_programarii';

-- 2. Add new columns to remindere
ALTER TABLE remindere
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS programat_la timestamptz,
  ADD COLUMN IF NOT EXISTS trimis_la timestamptz,
  ADD COLUMN IF NOT EXISTS eroare text,
  ADD COLUMN IF NOT EXISTS programare_id uuid REFERENCES programari(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_remindere_status ON remindere(status, programat_la)
  WHERE status = 'pending';

-- 3. setari_statie table (station settings including SMSO integration)
CREATE TABLE IF NOT EXISTS setari_statie (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  statie_id uuid NOT NULL REFERENCES statii(id) ON DELETE CASCADE,
  smso_api_key text,
  smso_sender text,
  sms_activ boolean NOT NULL DEFAULT false,
  auto_remindere boolean NOT NULL DEFAULT true,
  ora_trimitere time NOT NULL DEFAULT '09:00',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (statie_id)
);

ALTER TABLE setari_statie ENABLE ROW LEVEL SECURITY;
CREATE POLICY "setari_statie_crud" ON setari_statie FOR ALL
  USING (user_owns_statie(statie_id));

-- 4. sms_templates table
CREATE TABLE IF NOT EXISTS sms_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  statie_id uuid REFERENCES statii(id) ON DELETE CASCADE,
  tip tip_reminder NOT NULL,
  mesaj text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (statie_id, tip)
);

ALTER TABLE sms_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sms_templates_select" ON sms_templates FOR SELECT
  USING (statie_id IS NULL OR user_owns_statie(statie_id));
CREATE POLICY "sms_templates_write" ON sms_templates FOR ALL
  USING (user_owns_statie(statie_id));

-- 5. SQL function: generate daily reminders for a station
CREATE OR REPLACE FUNCTION genereaza_remindere_zilnice(p_statie_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer := 0;
  v_vehicul record;
  v_tip tip_reminder;
  v_zile integer;
  v_data_trimitere date;
  v_programat_la timestamptz;
  v_ora_trimitere time;
BEGIN
  -- Get station's send time preference
  SELECT COALESCE(ora_trimitere, '09:00'::time)
  INTO v_ora_trimitere
  FROM setari_statie
  WHERE statie_id = p_statie_id;

  IF v_ora_trimitere IS NULL THEN
    v_ora_trimitere := '09:00'::time;
  END IF;

  -- For each vehicle with ITP expiry
  FOR v_vehicul IN
    SELECT v.id AS vehicul_id, v.client_id, v.expirare_itp
    FROM vehicule v
    WHERE v.statie_id = p_statie_id
      AND v.expirare_itp IS NOT NULL
      AND v.client_id IS NOT NULL
  LOOP
    -- For each reminder type
    FOREACH v_tip IN ARRAY ARRAY['30_zile','15_zile','7_zile','1_zi','expirat']::tip_reminder[]
    LOOP
      -- Calculate send date
      v_zile := CASE v_tip
        WHEN '30_zile' THEN 30
        WHEN '15_zile' THEN 15
        WHEN '7_zile'  THEN 7
        WHEN '1_zi'    THEN 1
        ELSE 0
      END;

      v_data_trimitere := v_vehicul.expirare_itp - v_zile;
      v_programat_la := (v_data_trimitere || ' ' || v_ora_trimitere)::timestamptz;

      -- Only create if not already exists and send date hasn't passed by more than 7 days
      IF NOT EXISTS (
        SELECT 1 FROM remindere
        WHERE statie_id = p_statie_id
          AND vehicul_id = v_vehicul.vehicul_id
          AND tip = v_tip
      ) AND v_data_trimitere >= CURRENT_DATE - 7 THEN
        INSERT INTO remindere (
          statie_id, vehicul_id, client_id, tip,
          data_trimitere, canal, status, programat_la, trimis
        ) VALUES (
          p_statie_id, v_vehicul.vehicul_id, v_vehicul.client_id, v_tip,
          v_data_trimitere, 'sms', 'pending', v_programat_la, false
        );
        v_count := v_count + 1;
      END IF;
    END LOOP;
  END LOOP;

  RETURN v_count;
END;
$$;
