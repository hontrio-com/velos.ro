-- =========================================================
-- Migration 014: angajatii nu isi mai pot modifica singuri drepturile
--
-- Politica live angajati_crud (FOR ALL USING user_owns_statie(statie_id), fara
-- WITH CHECK) impreuna cu dreptul de tabela UPDATE al rolului authenticated
-- permit unui angajat ACTIV sa-si scrie singur, direct prin API (PostgREST),
-- permisiuni = {"programari": true, ...} - ocolind ce a setat proprietarul.
-- Pozele ITP (migratia 013) si restrictiile pe rute din dashboard se bazeaza
-- pe angajati.permisiuni.
--
-- Aplicatia scrie in angajati DOAR cu service role (src/lib/actions/angajati.ts);
-- browserul doar citeste. Retragem deci scrierea pentru anon / authenticated.
-- SELECT si politica existenta raman neschimbate (ecranele care citesc
-- angajatii functioneaza ca inainte). Exceptie: ruta de test
-- /api/test-angajati (insereaza un angajat de proba cu sesiunea
-- proprietarului) va raspunde cu eroare la pasul "insert" - e o ruta de depanare.
--
-- Se ruleaza INTEGRAL, intr-o singura tranzactie. Idempotenta.
-- Daca dupa REVOKE anon / authenticated mai pot scrie in angajati, migratia
-- se opreste cu eroare si nu schimba nimic.
-- Rollback:
--   GRANT INSERT, UPDATE, DELETE ON TABLE public.angajati TO authenticated;
-- =========================================================

SET LOCAL lock_timeout = '5s';

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.angajati FROM PUBLIC, anon, authenticated;

-- REVOKE-ul retrage doar drepturile acordate de rolul care il ruleaza (proprietarul
-- tabelei); drepturile acordate de alt rol raman. has_any_column_privilege vede si
-- drepturile pe coloane, iar has_*_privilege si pe cele date lui PUBLIC.
DO $verificare$
BEGIN
  IF has_any_column_privilege('anon', 'public.angajati', 'INSERT')
     OR has_any_column_privilege('anon', 'public.angajati', 'UPDATE')
     OR has_table_privilege('anon', 'public.angajati', 'DELETE')
     OR has_table_privilege('anon', 'public.angajati', 'TRUNCATE')
     OR has_any_column_privilege('authenticated', 'public.angajati', 'INSERT')
     OR has_any_column_privilege('authenticated', 'public.angajati', 'UPDATE')
     OR has_table_privilege('authenticated', 'public.angajati', 'DELETE')
     OR has_table_privilege('authenticated', 'public.angajati', 'TRUNCATE') THEN
    RAISE EXCEPTION '[014] anon/authenticated pot scrie inca in public.angajati. Rulati migratia ca proprietarul tabelei si verificati drepturile acordate de alte roluri sau pe coloane (pg_class.relacl, pg_attribute.attacl).';
  END IF;
END
$verificare$;

-- Verificare dupa aplicare (SQL Editor):
--
--   SELECT has_any_column_privilege('authenticated', 'public.angajati', 'UPDATE') AS upd,
--          has_any_column_privilege('authenticated', 'public.angajati', 'INSERT') AS ins,
--          has_table_privilege('authenticated', 'public.angajati', 'DELETE') AS del,
--          has_table_privilege('authenticated', 'public.angajati', 'SELECT') AS sel,
--          has_table_privilege('service_role', 'public.angajati', 'UPDATE') AS svc_upd;
--   -- asteptat: false, false, false, true, true
