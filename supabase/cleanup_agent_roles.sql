-- ============================================================
-- CLEANUP: Remove all 'agent' roles from user_roles table
-- COPY THIS TEXT → Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- Remove all 'agent' roles (users will default to 'user')
DELETE FROM public.user_roles WHERE role = 'agent';

-- Verify: should show 0 rows after deletion
SELECT * FROM public.user_roles WHERE role = 'agent';
