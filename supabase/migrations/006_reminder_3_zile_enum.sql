-- =========================================================
-- Migration 006 (PARTEA 1 din 2): valoarea de enum "3_zile"
--
-- Se ruleaza SINGURA, inaintea partii a 2-a: in Postgres o valoare noua de enum
-- nu poate fi folosita in aceeasi tranzactie in care a fost adaugata.
-- =========================================================

ALTER TYPE tip_reminder ADD VALUE IF NOT EXISTS '3_zile';
