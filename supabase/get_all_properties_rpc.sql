-- Run this in Supabase SQL Editor
CREATE OR REPLACE FUNCTION public.get_all_properties_rpc()
RETURNS SETOF public.properties
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  -- Returns all properties regardless of RLS, useful for Agent/Admin dashboard fallbacks
  SELECT * FROM public.properties ORDER BY created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_all_properties_rpc() TO anon, authenticated;
