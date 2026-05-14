-- ================================================================
-- Migration 004: Onboarding flag pe profiles
-- ================================================================

-- Adaugă coloana onboarding_completed
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

-- Utilizatorii existenți care au deja o stație = onboarding complet
UPDATE profiles p
SET onboarding_completed = true
WHERE EXISTS (
  SELECT 1 FROM statii s WHERE s.owner_id = p.id
);
