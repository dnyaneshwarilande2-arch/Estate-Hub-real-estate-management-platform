-- ============================================================
-- STEP 1: Run this in Supabase Dashboard → SQL Editor
-- This sets up the admin user and fixes RLS bootstrapping
-- ============================================================

-- Fix: Allow users to always read their OWN roles (without needing is_admin check)
-- This prevents the RLS bootstrapping problem
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Fix: Disable email confirmation requirement (optional - do in Dashboard > Auth > Settings instead)
-- OR ensure the admin user is confirmed

-- ============================================================
-- STEP 2: After the admin user REGISTERS via the app at /register,
-- run this to upgrade their role to admin:
-- (Replace the email if needed)
-- ============================================================

-- Upgrade user to admin by email
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Get the user ID from auth.users by email
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = 'sdcreation613@gmail.com';

  IF admin_user_id IS NOT NULL THEN
    -- Remove existing roles for this user
    DELETE FROM public.user_roles WHERE user_id = admin_user_id;
    
    -- Insert admin role
    INSERT INTO public.user_roles (user_id, role) 
    VALUES (admin_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    -- Ensure profile exists
    INSERT INTO public.profiles (user_id, full_name)
    VALUES (admin_user_id, 'Admin')
    ON CONFLICT (user_id) DO NOTHING;

    RAISE NOTICE 'Admin role assigned to user: %', admin_user_id;
  ELSE
    RAISE NOTICE 'User sdcreation613@gmail.com not found. Please register first via the app.';
  END IF;
END $$;

-- ============================================================
-- STEP 3: Confirm the admin email so they can login immediately
-- ============================================================
UPDATE auth.users 
SET email_confirmed_at = NOW(), 
    updated_at = NOW()
WHERE email = 'sdcreation613@gmail.com' 
  AND email_confirmed_at IS NULL;

-- ============================================================
-- STEP 4: Confirm ALL existing user emails (to prevent login block)
-- ============================================================
UPDATE auth.users 
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    updated_at = NOW()
WHERE email_confirmed_at IS NULL;

-- ============================================================
-- VERIFY: Check admin setup
-- ============================================================
SELECT 
  u.email,
  u.email_confirmed_at IS NOT NULL as email_confirmed,
  r.role
FROM auth.users u
LEFT JOIN public.user_roles r ON r.user_id = u.id
WHERE u.email = 'sdcreation613@gmail.com';
