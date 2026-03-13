-- ============================================================
-- FIX: Agent/Admin fallback for inserting inquiries
-- ============================================================

CREATE OR REPLACE FUNCTION public.insert_inquiry_rpc(
    p_user_id UUID,
    p_property_id UUID,
    p_message TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.inquiries (user_id, property_id, message)
  VALUES (p_user_id, p_property_id, p_message);
END;
$$;

GRANT EXECUTE ON FUNCTION public.insert_inquiry_rpc TO anon, authenticated;
