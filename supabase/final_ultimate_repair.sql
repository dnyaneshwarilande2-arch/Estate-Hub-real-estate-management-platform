-- ============================================================
-- FINAL ULTIMATE REPAIR SCRIPT
-- RUN THIS IN SUPABASE SQL EDITOR
-- ============================================================

-- 1. FIX ENUMS (Critical for Dashboard loading)
DO $$ 
BEGIN 
    -- inquiry_status
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'inquiry_status' AND e.enumlabel = 'approved') THEN
        ALTER TYPE public.inquiry_status ADD VALUE 'approved';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'inquiry_status' AND e.enumlabel = 'rejected') THEN
        ALTER TYPE public.inquiry_status ADD VALUE 'rejected';
    END IF;
    -- property_status
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'property_status' AND e.enumlabel = 'sold') THEN
        ALTER TYPE public.property_status ADD VALUE 'sold';
    END IF;
END $$;

-- 2. ENSURE COLUMNS EXIST
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inquiries' AND column_name = 'user_full_name') THEN
        ALTER TABLE public.inquiries ADD COLUMN user_full_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'listing_type') THEN
        -- Add listing_type if missing (needed by some RPCs)
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'listing_type') THEN
            CREATE TYPE public.listing_type AS ENUM ('sale', 'rent');
        END IF;
        ALTER TABLE public.properties ADD COLUMN listing_type public.listing_type DEFAULT 'sale';
    END IF;
END $$;

-- 3. RE-IMPLEMENT RPCs WITH CORRECT NAMES
CREATE OR REPLACE FUNCTION public.get_user_leads_ultra_rpc(p_user_id UUID, p_user_name TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB;
    v_clean_name TEXT;
BEGIN
    v_clean_name := LOWER(TRIM(p_user_name));

    SELECT jsonb_agg(sub) INTO result
    FROM (
        SELECT 
            i.*,
            jsonb_build_object(
                'title', p.title, 
                'posted_by', p.posted_by,
                'price', p.price,
                'location', p.location,
                'area', p.area,
                'property_type', p.property_type,
                'status', p.status,
                'listing_type', p.listing_type
            ) as properties,
            COALESCE(pr_sender.full_name, i.user_full_name, 'Verified Buyer') as user_full_name,
            COALESCE(pr_owner.full_name, 'Verified Seller') as property_owner_name,
            u_sender.email as user_email,
            -- DEEP VERIFICATION: Check if THIS property was sold to THIS user
            EXISTS (
                SELECT 1 FROM public.inquiries i2
                LEFT JOIN public.profiles p2 ON i2.user_id = p2.user_id
                WHERE i2.property_id = i.property_id 
                AND i2.status IN ('approved', 'closed')
                AND (
                    i2.user_id = p_user_id 
                    OR (v_clean_name != '' AND LOWER(TRIM(i2.user_full_name)) = v_clean_name)
                    OR (v_clean_name != '' AND LOWER(TRIM(p2.full_name)) = v_clean_name)
                )
            ) as is_sold_to_me,
            -- Check if property is sold but NOT to me
            (p.status = 'sold' AND NOT EXISTS (
                SELECT 1 FROM public.inquiries i3
                LEFT JOIN public.profiles p3 ON i3.user_id = p3.user_id
                WHERE i3.property_id = i.property_id 
                AND i3.status IN ('approved', 'closed')
                AND (
                    i3.user_id = p_user_id 
                    OR (v_clean_name != '' AND LOWER(TRIM(i3.user_full_name)) = v_clean_name)
                    OR (v_clean_name != '' AND LOWER(TRIM(p3.full_name)) = v_clean_name)
                )
            )) as is_sold_to_other
        FROM public.inquiries i
        LEFT JOIN public.properties p ON i.property_id = p.id
        LEFT JOIN public.profiles pr_sender ON i.user_id = pr_sender.user_id
        LEFT JOIN public.profiles pr_owner ON p.posted_by = pr_owner.user_id
        LEFT JOIN auth.users u_sender ON i.user_id = u_sender.id
        WHERE 
            i.user_id = p_user_id 
            OR p.posted_by = p_user_id
            OR (v_clean_name != '' AND LOWER(TRIM(pr_sender.full_name)) = v_clean_name)
            OR (v_clean_name != '' AND LOWER(TRIM(i.user_full_name)) = v_clean_name)
        ORDER BY i.created_at DESC
    ) sub;
    
    RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- 4. Restore get_user_properties_ultra_rpc
CREATE OR REPLACE FUNCTION public.get_user_properties_ultra_rpc(p_user_id UUID, p_user_name TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB;
    v_clean_name TEXT;
BEGIN
    v_clean_name := LOWER(TRIM(p_user_name));

    SELECT jsonb_agg(sub) INTO result
    FROM (
        SELECT 
            p.*,
            (SELECT jsonb_agg(pi.*) FROM public.property_images pi WHERE pi.property_id = p.id) as property_images,
            jsonb_build_object('full_name', pr.full_name) as profiles
        FROM public.properties p
        LEFT JOIN public.profiles pr ON p.posted_by = pr.user_id
        WHERE 
            p.posted_by = p_user_id
            OR (v_clean_name != '' AND LOWER(TRIM(pr.full_name)) = v_clean_name)
        ORDER BY p.created_at DESC
    ) sub;
    
    RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- 5. Inquiry status update with auto-sold logic
CREATE OR REPLACE FUNCTION public.update_inquiry_status_rpc(
    p_inquiry_id UUID,
    p_status TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_property_id UUID;
BEGIN
    -- 1. Update the inquiry status
    UPDATE public.inquiries
    SET status = p_status::public.inquiry_status
    WHERE id = p_inquiry_id
    RETURNING property_id INTO v_property_id;

    -- 2. If the status is 'approved' or 'closed', mark the property as 'sold'
    IF p_status IN ('approved', 'closed') AND v_property_id IS NOT NULL THEN
        -- Mark property as sold
        UPDATE public.properties
        SET status = 'sold'::public.property_status
        WHERE id = v_property_id;

        -- Automatically reject all OTHER inquiries for this property to avoid duplicate sales
        UPDATE public.inquiries
        SET status = 'rejected'::public.inquiry_status
        WHERE property_id = v_property_id AND id != p_inquiry_id;
    END IF;
END;
$$;

-- Grants
GRANT EXECUTE ON FUNCTION public.get_user_leads_ultra_rpc(UUID, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_user_properties_ultra_rpc(UUID, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.update_inquiry_status_rpc(UUID, TEXT) TO authenticated, anon;
