-- ============================================================
-- ULTRA-VISIBILITY: Deep Recovery for Properties & Favorites
-- Ensures users can see their data regardless of session state
-- ============================================================

-- 1. Fetch User Properties (Bypasses RLS using ID and Name recovery)
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
            jsonb_agg(DISTINCT pi.*) as property_images,
            jsonb_build_object('full_name', pr.full_name) as profiles
        FROM public.properties p
        LEFT JOIN public.property_images pi ON p.id = pi.property_id
        LEFT JOIN public.profiles pr ON p.posted_by = pr.user_id
        WHERE 
            p.posted_by = p_user_id
            OR (v_clean_name != '' AND LOWER(TRIM(pr.full_name)) = v_clean_name)
        GROUP BY p.id, pr.full_name
        ORDER BY p.created_at DESC
    ) sub;
    
    RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_properties_ultra_rpc(UUID, TEXT) TO authenticated, anon;

-- 2. Fetch User Favorites (Bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_user_favorites_ultra_rpc(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_agg(sub) INTO result
    FROM (
        SELECT 
            f.property_id,
            jsonb_build_object(
                'id', p.id,
                'title', p.title,
                'price', p.price,
                'location', p.location,
                'city', p.city,
                'property_type', p.property_type,
                'listing_type', p.listing_type,
                'status', p.status,
                'bedrooms', p.bedrooms,
                'bathrooms', p.bathrooms,
                'area', p.area,
                'property_images', (
                    SELECT jsonb_agg(pi.*) 
                    FROM public.property_images pi 
                    WHERE pi.property_id = p.id
                )
            ) as properties
        FROM public.favorites f
        JOIN public.properties p ON f.property_id = p.id
        WHERE f.user_id = p_user_id
        ORDER BY f.created_at DESC
    ) sub;
    
    RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_favorites_ultra_rpc(UUID) TO authenticated, anon;

-- 3. Toggle Favorite (Bypasses RLS for Guest/Demo recovery)
CREATE OR REPLACE FUNCTION public.toggle_favorite_rpc(p_user_id UUID, p_property_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM public.favorites 
        WHERE user_id = p_user_id AND property_id = p_property_id
    ) INTO v_exists;

    IF v_exists THEN
        DELETE FROM public.favorites 
        WHERE user_id = p_user_id AND property_id = p_property_id;
        RETURN FALSE;
    ELSE
        INSERT INTO public.favorites (user_id, property_id)
        VALUES (p_user_id, p_property_id);
        RETURN TRUE;
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_favorite_rpc(UUID, UUID) TO authenticated, anon;
