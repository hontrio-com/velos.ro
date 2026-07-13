-- Backfill: normalizează numele clienților la Title Case (Robert Alexandru)
-- Se aplică o singură dată, pentru TOȚI clienții din TOATE conturile/stațiile.
-- Rulează în Supabase Dashboard → SQL Editor.

-- 1) PREVIEW (opțional) — vezi ce se va schimba, fără a modifica nimic:
-- select
--   nume    as nume_vechi,    initcap(nume)    as nume_nou,
--   prenume as prenume_vechi, initcap(prenume) as prenume_nou
-- from clienti
-- where nume <> initcap(nume)
--    or (prenume is not null and prenume <> initcap(prenume));

-- 2) APLICĂ backfill-ul:
update clienti
set nume = initcap(nume)
where nume is not null
  and nume <> initcap(nume);

update clienti
set prenume = initcap(prenume)
where prenume is not null
  and prenume <> ''
  and prenume <> initcap(prenume);
