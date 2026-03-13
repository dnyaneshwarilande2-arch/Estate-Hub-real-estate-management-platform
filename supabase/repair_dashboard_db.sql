-- ============================================================
-- CRITICAL DATABASE REPAIR SCRIPT
-- Fixes missing columns and broken RPCs that cause Dashboard crashes
-- ============================================================

-- 1. Ensure user_full_name exists on inquiries for name-based recovery
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inquiries' AND column_name = 'user_full_name') THEN
        ALTER TABLE public.inquiries ADD COLUMN user_full_name TEXT;
    END IF;
END $$;

-- 2. Fix get_user_leads_ultra_rpc (Syntax Error Repair)
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
            COALESCE(pr_sender.full_name, i.user_full_name, 'Verified Buyer') as buyer_name,
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

-- 3. Restore get_user_properties_ultra_rpc (The missing 404 function)
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

-- 4. Restore/Fix get_user_leads_rpc for backward compatibility
CREATE OR REPLACE FUNCTION public.get_user_leads_rpc(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN public.get_user_leads_ultra_rpc(p_user_id, '');
END;
$$;

-- Grant permissions again
GRANT EXECUTE ON FUNCTION public.get_user_leads_ultra_rpc(UUID, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_user_properties_ultra_rpc(UUID, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_user_leads_rpc(UUID) TO authenticated, anon;
