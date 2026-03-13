-- ============================================================
-- DELETE: virat@123gmail.com and agent@123gmail.com
-- COPY THIS TEXT → Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- Delete from profiles
DELETE FROM public.profiles
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('virat@123gmail.com', 'agent@123gmail.com')
);

-- Delete from user_roles
DELETE FROM public.user_roles
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('virat@123gmail.com', 'agent@123gmail.com')
);

-- Delete from inquiries
DELETE FROM public.inquiries
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('virat@123gmail.com', 'agent@123gmail.com')
);

-- Delete from favorites
DELETE FROM public.favorites
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('virat@123gmail.com', 'agent@123gmail.com')
);

-- Verify: should return 0 rows for both emails
SELECT email FROM auth.users 
WHERE email IN ('virat@123gmail.com', 'agent@123gmail.com');
