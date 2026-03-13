-- ============================================================
-- DATABASE UNLOCK SCRIPT (RESILIENT VERSION)
-- Fixes "relation does not exist" errors by checking table existence.
-- ============================================================

DO $$ 
BEGIN 
    -- 1. Profiles Table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;
    END IF;

    -- 2. User Roles Table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles') THEN
        ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;
    END IF;

    -- 3. Properties Table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'properties') THEN
        ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_posted_by_fkey;
    END IF;

    -- 4. Favorites Table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'favorites') THEN
        ALTER TABLE public.favorites DROP CONSTRAINT IF EXISTS favorites_user_id_fkey;
    END IF;

    -- 5. Inquiries Table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inquiries') THEN
        ALTER TABLE public.inquiries DROP CONSTRAINT IF EXISTS inquiries_user_id_fkey;
    END IF;
END $$;

-- 6. REPAIR sync_user_role RPC (Bypass check)
CREATE OR REPLACE FUNCTION public.sync_user_role(
    p_user_id UUID,
    p_email TEXT,
    p_role TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only run if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles') THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (p_user_id, p_role::public.app_role)
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
END;
$$;

-- 7. REPAIR profile trigger to be safer
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    INSERT INTO public.profiles (user_id, full_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 8. RPC for deep name discovery (Bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_profiles_by_name_rpc(p_name TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        SELECT jsonb_agg(sub) INTO result
        FROM (
            SELECT user_id 
            FROM public.profiles 
            WHERE LOWER(TRIM(full_name)) = LOWER(TRIM(p_name))
        ) sub;
    ELSE
        result := '[]'::jsonb;
    END IF;
    
    RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- 9. Final Enum and Column sync
DO $$ 
BEGIN 
    -- inquiry_status
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inquiry_status') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'inquiry_status' AND e.enumlabel = 'approved') THEN
            ALTER TYPE public.inquiry_status ADD VALUE 'approved';
        END IF;
    END IF;

    -- property_status
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'property_status') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'property_status' AND e.enumlabel = 'sold') THEN
            ALTER TYPE public.property_status ADD VALUE 'sold';
        END IF;
    END IF;
END $$;

-- Grants
GRANT EXECUTE ON FUNCTION public.get_profiles_by_name_rpc(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.sync_user_role(UUID, TEXT, TEXT) TO authenticated, anon;
