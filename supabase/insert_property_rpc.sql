-- ============================================================
-- FIX: Agent/Admin fallback for inserting properties & images
-- ============================================================

CREATE OR REPLACE FUNCTION public.insert_property_rpc(
    p_title TEXT,
    p_description TEXT,
    p_price NUMERIC,
    p_location TEXT,
    p_city TEXT,
    p_property_type TEXT,
    p_bedrooms INTEGER,
    p_bathrooms INTEGER,
    p_area NUMERIC,
    p_posted_by UUID,
    p_status TEXT,
    p_listing_type TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_property_id UUID;
BEGIN
  -- Insert bypassing RLS
  INSERT INTO public.properties (
      title, description, price, location, city, property_type, bedrooms, bathrooms, area, posted_by, status, listing_type
  ) VALUES (
      p_title, p_description, p_price, p_location, p_city, p_property_type::public.property_type, p_bedrooms, p_bathrooms, p_area, p_posted_by, p_status::public.property_status, p_listing_type::public.listing_type
  ) RETURNING id INTO new_property_id;
  
  RETURN new_property_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.insert_property_rpc TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.insert_property_image_rpc(
    p_property_id UUID,
    p_image_url TEXT,
    p_is_primary BOOLEAN
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.property_images (property_id, image_url, is_primary)
  VALUES (p_property_id, p_image_url, p_is_primary);
END;
$$;

GRANT EXECUTE ON FUNCTION public.insert_property_image_rpc TO anon, authenticated;
