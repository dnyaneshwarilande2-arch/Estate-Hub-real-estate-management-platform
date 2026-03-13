-- ============================================================
-- ADD ADDRESS TO PROFILES
-- ============================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT DEFAULT '';
