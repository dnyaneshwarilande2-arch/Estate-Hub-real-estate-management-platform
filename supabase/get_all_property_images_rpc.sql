-- Run this in Supabase SQL Editor
CREATE OR REPLACE FUNCTION public.get_all_property_images_rpc()
RETURNS SETOF public.property_images
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  -- Returns all property images regardless of RLS
  SELECT * FROM public.property_images;
$$;

GRANT EXECUTE ON FUNCTION public.get_all_property_images_rpc() TO anon, authenticated;
