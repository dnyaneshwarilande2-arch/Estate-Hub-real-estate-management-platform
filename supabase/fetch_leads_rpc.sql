-- ============================================================
-- ULTRA-FIX: Deep Visibility for Demo/Mock Users
-- This script uses both IDs AND Names to ensure Rohits and Mitalis
-- can always see their messages regardless of session resets.
-- ============================================================

-- 1. Create the Ultra-Leads RPC (Bypasses RLS to verify ownership by name - HARDENED)
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

-- 2. Grant execute access
GRANT EXECUTE ON FUNCTION public.get_user_leads_ultra_rpc(UUID, TEXT) TO authenticated, anon;

-- 3. Update the existing get_user_leads_rpc to point to the ultra version for backward compatibility
CREATE OR REPLACE FUNCTION public.get_user_leads_rpc(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Fallback to name 'ROHIT' if we don't have a name, but the dashboard will use ultra instead
    RETURN public.get_user_leads_ultra_rpc(p_user_id, '');
END;
$$;

-- 4. RPC to update inquiry status (for Demo Approval + Auto-Sold Feature)
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

GRANT EXECUTE ON FUNCTION public.update_inquiry_status_rpc(UUID, TEXT) TO authenticated, anon;

-- 5. RPC to fetch success inquiry for a property (Bypasses RLS for certificate recovery)
CREATE OR REPLACE FUNCTION public.get_property_success_inquiry_rpc(p_property_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'id', i.id,
        'user_id', i.user_id,
        'message', i.message,
        'status', i.status,
        'created_at', i.created_at,
        'buyer_name', COALESCE(pr_buyer.full_name, i.user_full_name, 'Verified Buyer'),
        'seller_name', COALESCE(pr_seller.full_name, 'Verified Seller')
    ) INTO result
    FROM public.inquiries i
    LEFT JOIN public.properties p ON i.property_id = p.id
    LEFT JOIN public.profiles pr_buyer ON i.user_id = pr_buyer.user_id
    LEFT JOIN public.profiles pr_seller ON p.posted_by = pr_seller.user_id
    WHERE i.property_id = p_property_id 
    AND i.status IN ('approved', 'closed')
    ORDER BY i.created_at DESC
    LIMIT 1;

    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_property_success_inquiry_rpc(UUID) TO authenticated, anon;
