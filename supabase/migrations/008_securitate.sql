-- =========================================================
-- Migration 008: inchiderea gaurilor de securitate gasite la auditul din 28.08.2026
--
-- Trei probleme, toate verificate practic pe productie:
--
-- 1. Politica "profiles_update_own" permite UPDATE pe TOT randul, iar Postgres
--    aplica RLS la nivel de rand, nu de coloana. Orice utilizator autentificat
--    isi putea seta singur `is_admin`, `plan`, `sms_credit`, `subscription_status`
--    printr-un PATCH din consola browserului. Testat cu o sesiune reala: PERMIS.
--
-- 2. Tabelele de prospectare nu au RLS activ, deci sunt citibile integral cu cheia
--    anon publica din bundle-ul JS: statii_rar (3.020 randuri), statii_rar_crm
--    (212 randuri cu notite interne), prospectare_sms_log (277 numere de telefon
--    si textul mesajelor comerciale).
--
-- 3. Politica "statii_public_read" expune toate statiile active oricui, inclusiv
--    coloana `owner_id`. Cu acel id se putea tinti stergerea contului altcuiva
--    (vezi reparatia din src/lib/actions/angajati.ts). Paginile publice
--    (/[slug], booking) folosesc service client, deci nu au nevoie de acces anon.
-- =========================================================

-- ── 1. profiles: doar coloanele de profil raman scriabile de utilizator ──────
-- Coloanele privilegiate (plan, sms_credit, is_admin, subscription_*, trial_*,
-- suspended_*, stripe_*) se modifica exclusiv prin service role: webhook Stripe,
-- actiuni de admin, onboarding. Verificat: singurul UPDATE facut cu clientul
-- utilizatorului este updateProfilAction (full_name, phone, updated_at).
REVOKE UPDATE ON profiles FROM authenticated;
REVOKE UPDATE ON profiles FROM anon;

GRANT UPDATE (full_name, phone, avatar_url, updated_at) ON profiles TO authenticated;

-- ── 2. Tabelele de prospectare: doar service role ───────────────────────────
-- Interfata de admin le citeste server-side cu service client (care ocoleste RLS),
-- deci activarea RLS fara politici nu strica nimic si taie complet accesul anon.
ALTER TABLE statii_rar ENABLE ROW LEVEL SECURITY;
ALTER TABLE statii_rar_crm ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospectare_sms_log ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON statii_rar FROM anon, authenticated;
REVOKE ALL ON statii_rar_crm FROM anon, authenticated;
REVOKE ALL ON prospectare_sms_log FROM anon, authenticated;

-- ── 3. statii: publicul nu mai citeste direct tabela ────────────────────────
-- Paginile publice trec prin service client, deci politica de citire publica nu
-- mai are niciun consumator legitim — doar scrapere si atacatori.
DROP POLICY IF EXISTS "statii_public_read" ON statii;
REVOKE SELECT ON statii FROM anon;

-- Proprietarul isi vede in continuare statiile prin "statii_select_own",
-- iar angajatii prin service client (getStatieForUser).

-- ── Verificare rapida dupa aplicare ─────────────────────────────────────────
-- Ruleaza in SQL Editor si compara cu asteptarile din comentarii:
--
--   SELECT grantee, privilege_type, column_name
--   FROM information_schema.column_privileges
--   WHERE table_name = 'profiles' AND grantee = 'authenticated' AND privilege_type = 'UPDATE';
--   -- asteptat: doar full_name, phone, avatar_url, updated_at
--
--   SELECT relname, relrowsecurity FROM pg_class
--   WHERE relname IN ('statii_rar','statii_rar_crm','prospectare_sms_log');
--   -- asteptat: relrowsecurity = true pentru toate trei
