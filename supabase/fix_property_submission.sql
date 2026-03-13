-- ============================================================
-- FIX: Property Submission & RLS Policies
-- Run this in Supabase SQL Editor to solve the "Submission Error"
-- ============================================================

-- 1. Ensure RLS is enabled
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- 2. Property Insert Policy (Allows users to list properties)
DROP POLICY IF EXISTS "Users can insert own properties" ON public.properties;
CREATE POLICY "Users can insert own properties" 
  ON public.properties FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = posted_by);

-- 3. Property Image Insert Policy
DROP POLICY IF EXISTS "Users can insert property images" ON public.property_images;
CREATE POLICY "Users can insert property images" 
  ON public.property_images FOR INSERT TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE id = property_id AND posted_by = auth.uid()
    )
  );

-- 4. Inquiries Insert Policy (Allows users to send messages/requests)
DROP POLICY IF EXISTS "Users can insert inquiries" ON public.inquiries;
CREATE POLICY "Users can insert inquiries" 
  ON public.inquiries FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = user_id);

-- 5. RE-CREATE RPC with explicit parameter order and types to fix "not found in schema cache"
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
    p_status TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_property_id UUID;
BEGIN
  INSERT INTO public.properties (
      title, description, price, location, city, property_type, bedrooms, bathrooms, area, posted_by, status
  ) VALUES (
      p_title, p_description, p_price, p_location, p_city, 
      p_property_type::public.property_type, 
      p_bedrooms, p_bathrooms, p_area, 
      p_posted_by, 
      p_status::public.property_status
  ) RETURNING id INTO new_property_id;
  
  RETURN new_property_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.insert_property_rpc(TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT, INTEGER, INTEGER, NUMERIC, UUID, TEXT) TO authenticated, anon;

-- 6. Helper for inquiries fallback
CREATE OR REPLACE FUNCTION public.insert_inquiry_rpc(
    p_user_id UUID,
    p_property_id UUID,
    p_message TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_inquiry_id UUID;
BEGIN
  INSERT INTO public.inquiries (user_id, property_id, message, status)
  VALUES (p_user_id, p_property_id, p_message, 'pending')
  RETURNING id INTO new_inquiry_id;
  
  RETURN new_inquiry_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.insert_inquiry_rpc(UUID, UUID, TEXT) TO authenticated, anon;

-- 7. Helper for images fallback
CREATE OR REPLACE FUNCTION public.insert_property_image_rpc(
    p_property_id UUID,
    p_image_url TEXT,
    p_is_primary BOOLEAN
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_img_id UUID;
BEGIN
  INSERT INTO public.property_images (property_id, image_url, is_primary)
  VALUES (p_property_id, p_image_url, p_is_primary)
  RETURNING id INTO new_img_id;
  
  RETURN new_img_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.insert_property_image_rpc(UUID, TEXT, BOOLEAN) TO authenticated, anon;
