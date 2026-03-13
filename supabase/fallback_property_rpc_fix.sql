-- Run this in Supabase SQL Editor
CREATE OR REPLACE FUNCTION public.update_property_status_rpc(p_property_id UUID, p_status TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- We allow the RPC to bypass RLS to force update the status
  -- The parameter type was changed to TEXT and casted to avoid type errors
  UPDATE public.properties
  SET status = p_status::public.property_status
  WHERE id = p_property_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_property_status_rpc(UUID, TEXT) TO anon, authenticated;
