-- ================================================================
-- Migration 003: SMS quota centralizat per profil
-- ================================================================

-- 1. Adaugă câmpul plan la profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'trial'
    CHECK (plan IN ('trial', 'basic', 'pro', 'enterprise'));

-- 2. Elimină smso_api_key din setari_statie (nu mai e nevoie)
ALTER TABLE setari_statie
  DROP COLUMN IF EXISTS smso_api_key,
  DROP COLUMN IF EXISTS smso_sender,
  DROP COLUMN IF EXISTS sms_activ;

-- 3. Tabel quota SMS per profil per lună
CREATE TABLE IF NOT EXISTS sms_quota (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  luna        date NOT NULL,
  sms_trimise int NOT NULL DEFAULT 0,
  sms_limita  int NOT NULL DEFAULT 50,
  UNIQUE (profile_id, luna)
);

ALTER TABLE sms_quota ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quota_proprie" ON sms_quota
  FOR ALL USING (profile_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_sms_quota_profile_luna
  ON sms_quota(profile_id, luna);

-- 4. Funcție: returnează quota lunii curente (upsert automat)
CREATE OR REPLACE FUNCTION get_sms_quota(p_profile_id uuid)
RETURNS TABLE(trimise int, limita int, ramase int)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_luna  date := date_trunc('month', CURRENT_DATE)::date;
  v_plan  text;
  v_limita int;
BEGIN
  SELECT plan INTO v_plan FROM profiles WHERE id = p_profile_id;

  v_limita := CASE v_plan
    WHEN 'trial'      THEN 50
    WHEN 'basic'      THEN 200
    WHEN 'pro'        THEN 500
    WHEN 'enterprise' THEN 9999
    ELSE 50
  END;

  INSERT INTO sms_quota (profile_id, luna, sms_trimise, sms_limita)
  VALUES (p_profile_id, v_luna, 0, v_limita)
  ON CONFLICT (profile_id, luna) DO UPDATE
    SET sms_limita = v_limita;

  RETURN QUERY
  SELECT
    q.sms_trimise,
    q.sms_limita,
    GREATEST(0, q.sms_limita - q.sms_trimise)
  FROM sms_quota q
  WHERE q.profile_id = p_profile_id AND q.luna = v_luna;
END;
$$;

-- 5. Funcție: increment quota după trimitere reușită
CREATE OR REPLACE FUNCTION increment_sms_quota(p_profile_id uuid, p_count int DEFAULT 1)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE sms_quota
  SET sms_trimise = sms_trimise + p_count
  WHERE profile_id = p_profile_id
    AND luna = date_trunc('month', CURRENT_DATE)::date;
END;
$$;
