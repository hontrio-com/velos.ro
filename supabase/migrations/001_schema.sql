-- ============================================================
-- ITP CRM — Schema completă Supabase
-- ============================================================

-- Extensii
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE status_programare AS ENUM ('programat', 'in_lucru', 'finalizat', 'anulat', 'neprezent');
CREATE TYPE rezultat_itp AS ENUM ('admis', 'respins', 'readmis');
CREATE TYPE tip_reminder AS ENUM ('30_zile', '15_zile', '7_zile', '1_zi', 'expirat');
CREATE TYPE canal_comunicare AS ENUM ('sms', 'email');
CREATE TYPE directie_mesaj AS ENUM ('trimis', 'primit');
CREATE TYPE status_mesaj AS ENUM ('pending', 'trimis', 'livrat', 'eroare');

-- ============================================================
-- FUNCȚIE updated_at (refolosibilă)
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TABELE
-- ============================================================

-- 1. PROFILES (extinde auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 2. STATII
CREATE TABLE statii (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  nume TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  adresa TEXT,
  oras TEXT,
  judet TEXT,
  telefon TEXT,
  email TEXT,
  program_lucru JSONB DEFAULT '{"luni":{"start":"08:00","end":"17:00"},"marti":{"start":"08:00","end":"17:00"},"miercuri":{"start":"08:00","end":"17:00"},"joi":{"start":"08:00","end":"17:00"},"vineri":{"start":"08:00","end":"17:00"},"sambata":null,"duminica":null}'::jsonb,
  durata_slot_minute INTEGER NOT NULL DEFAULT 30,
  culoare TEXT NOT NULL DEFAULT '#1877F2',
  activa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER statii_updated_at
  BEFORE UPDATE ON statii
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_statii_owner ON statii(owner_id);
CREATE INDEX idx_statii_slug ON statii(slug);

-- 3. ANGAJATI
CREATE TABLE angajati (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  statie_id UUID NOT NULL REFERENCES statii(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  nume TEXT NOT NULL,
  functie TEXT,
  telefon TEXT,
  email TEXT,
  activ BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER angajati_updated_at
  BEFORE UPDATE ON angajati
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 4. CLIENTI
CREATE TABLE clienti (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  statie_id UUID NOT NULL REFERENCES statii(id) ON DELETE CASCADE,
  nume TEXT NOT NULL,
  prenume TEXT,
  telefon TEXT NOT NULL,
  email TEXT,
  cnp TEXT,
  adresa TEXT,
  observatii TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER clienti_updated_at
  BEFORE UPDATE ON clienti
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_clienti_statie ON clienti(statie_id);
CREATE INDEX idx_clienti_telefon ON clienti(statie_id, telefon);
CREATE INDEX idx_clienti_email ON clienti(statie_id, email);
-- Index full-text search simplu (fără unaccent pentru compatibilitate)
CREATE INDEX idx_clienti_search ON clienti USING gin(
  to_tsvector('simple', coalesce(nume, '') || ' ' || coalesce(prenume, '') || ' ' || coalesce(telefon, ''))
);

-- 5. VEHICULE
CREATE TABLE vehicule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  statie_id UUID NOT NULL REFERENCES statii(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clienti(id) ON DELETE CASCADE,
  nr_inmatriculare TEXT NOT NULL,
  marca TEXT,
  model TEXT,
  an_fabricatie INTEGER,
  serie_sasiu TEXT,
  culoare TEXT,
  expirare_itp DATE,
  observatii TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(statie_id, nr_inmatriculare)
);

CREATE TRIGGER vehicule_updated_at
  BEFORE UPDATE ON vehicule
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_vehicule_statie ON vehicule(statie_id);
CREATE INDEX idx_vehicule_client ON vehicule(client_id);
CREATE INDEX idx_vehicule_nr ON vehicule(statie_id, nr_inmatriculare);
CREATE INDEX idx_vehicule_expirare ON vehicule(expirare_itp) WHERE expirare_itp IS NOT NULL;

-- 6. PROGRAMARI
CREATE TABLE programari (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  statie_id UUID NOT NULL REFERENCES statii(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clienti(id) ON DELETE RESTRICT,
  vehicul_id UUID NOT NULL REFERENCES vehicule(id) ON DELETE RESTRICT,
  data_programare DATE NOT NULL,
  ora_start TIME NOT NULL,
  ora_sfarsit TIME NOT NULL,
  status status_programare NOT NULL DEFAULT 'programat',
  tip_serviciu TEXT NOT NULL DEFAULT 'ITP',
  pret NUMERIC(10, 2),
  observatii TEXT,
  sms_confirmare_trimis BOOLEAN NOT NULL DEFAULT false,
  sms_reminder_trimis BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER programari_updated_at
  BEFORE UPDATE ON programari
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_programari_statie ON programari(statie_id);
CREATE INDEX idx_programari_data ON programari(statie_id, data_programare);
CREATE INDEX idx_programari_client ON programari(client_id);
CREATE INDEX idx_programari_vehicul ON programari(vehicul_id);
CREATE INDEX idx_programari_status ON programari(statie_id, status);

-- 7. REZULTATE ITP
CREATE TABLE rezultate_itp (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  programare_id UUID NOT NULL REFERENCES programari(id) ON DELETE CASCADE UNIQUE,
  rezultat rezultat_itp NOT NULL,
  observatii_tehnice TEXT,
  inspector TEXT,
  data_inspectie DATE NOT NULL,
  expirare_noua DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. REMINDERE
CREATE TABLE remindere (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  statie_id UUID NOT NULL REFERENCES statii(id) ON DELETE CASCADE,
  vehicul_id UUID NOT NULL REFERENCES vehicule(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clienti(id) ON DELETE CASCADE,
  tip tip_reminder NOT NULL,
  data_trimitere DATE NOT NULL,
  trimis BOOLEAN NOT NULL DEFAULT false,
  canal canal_comunicare NOT NULL DEFAULT 'sms',
  mesaj TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_remindere_statie ON remindere(statie_id);
CREATE INDEX idx_remindere_data ON remindere(data_trimitere) WHERE trimis = false;

-- 9. MESAJE
CREATE TABLE mesaje (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  statie_id UUID NOT NULL REFERENCES statii(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clienti(id) ON DELETE SET NULL,
  telefon TEXT NOT NULL,
  mesaj TEXT NOT NULL,
  tip canal_comunicare NOT NULL DEFAULT 'sms',
  directie directie_mesaj NOT NULL DEFAULT 'trimis',
  status status_mesaj NOT NULL DEFAULT 'pending',
  programare_id UUID REFERENCES programari(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mesaje_statie ON mesaje(statie_id);
CREATE INDEX idx_mesaje_client ON mesaje(client_id);

-- 10. SLOTURI BLOCATE
CREATE TABLE sloturi_blocate (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  statie_id UUID NOT NULL REFERENCES statii(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  ora_start TIME NOT NULL,
  ora_sfarsit TIME NOT NULL,
  motiv TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sloturi_statie_data ON sloturi_blocate(statie_id, data);

-- ============================================================
-- TRIGGER: creare profil automat la signup
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, phone)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE statii ENABLE ROW LEVEL SECURITY;
ALTER TABLE angajati ENABLE ROW LEVEL SECURITY;
ALTER TABLE clienti ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicule ENABLE ROW LEVEL SECURITY;
ALTER TABLE programari ENABLE ROW LEVEL SECURITY;
ALTER TABLE rezultate_itp ENABLE ROW LEVEL SECURITY;
ALTER TABLE remindere ENABLE ROW LEVEL SECURITY;
ALTER TABLE mesaje ENABLE ROW LEVEL SECURITY;
ALTER TABLE sloturi_blocate ENABLE ROW LEVEL SECURITY;

-- PROFILES policies
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- STATII policies
CREATE POLICY "statii_select_own" ON statii FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY "statii_insert_own" ON statii FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "statii_update_own" ON statii FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "statii_delete_own" ON statii FOR DELETE USING (owner_id = auth.uid());

-- Public read pentru booking page
CREATE POLICY "statii_public_read" ON statii FOR SELECT USING (activa = true);

-- Helper function: user owns statie
CREATE OR REPLACE FUNCTION user_owns_statie(p_statie_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM statii WHERE id = p_statie_id AND owner_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- CLIENTI policies
CREATE POLICY "clienti_crud" ON clienti FOR ALL USING (user_owns_statie(statie_id));

-- VEHICULE policies
CREATE POLICY "vehicule_crud" ON vehicule FOR ALL USING (user_owns_statie(statie_id));

-- PROGRAMARI policies
CREATE POLICY "programari_crud" ON programari FOR ALL USING (user_owns_statie(statie_id));

-- REZULTATE ITP policies
CREATE POLICY "rezultate_crud" ON rezultate_itp FOR ALL
  USING (EXISTS (
    SELECT 1 FROM programari p
    JOIN statii s ON s.id = p.statie_id
    WHERE p.id = rezultate_itp.programare_id AND s.owner_id = auth.uid()
  ));

-- REMINDERE policies
CREATE POLICY "remindere_crud" ON remindere FOR ALL USING (user_owns_statie(statie_id));

-- MESAJE policies
CREATE POLICY "mesaje_crud" ON mesaje FOR ALL USING (user_owns_statie(statie_id));

-- SLOTURI BLOCATE policies
CREATE POLICY "sloturi_crud" ON sloturi_blocate FOR ALL USING (user_owns_statie(statie_id));

-- ANGAJATI policies
CREATE POLICY "angajati_crud" ON angajati FOR ALL USING (user_owns_statie(statie_id));
