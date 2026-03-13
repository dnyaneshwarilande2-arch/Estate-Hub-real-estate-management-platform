-- Run this in Supabase SQL Editor
CREATE OR REPLACE FUNCTION public.update_property_status_rpc(p_property_id UUID, p_status public.property_status)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- We allow the RPC to bypass RLS to force update the status
  UPDATE public.properties
  SET status = p_status
  WHERE id = p_property_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_property_status_rpc(UUID, public.property_status) TO authenticated;
