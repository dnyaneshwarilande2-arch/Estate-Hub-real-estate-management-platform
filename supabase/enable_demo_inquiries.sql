-- ============================================================
-- FIX: Enable Demo/Mock Users to send Inquiries
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Remove the strict foreign key that requires every sender to be a real registered user
-- This allows "Demo Mode" users to successfully save inquiries to the database.
ALTER TABLE public.inquiries DROP CONSTRAINT IF EXISTS inquiries_user_id_fkey;

-- 2. Update the Inquiry RPC to be more robust
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
  -- We don't check for auth.uid() here to allow Demo/Mock users to pass their fake IDs
  INSERT INTO public.inquiries (user_id, property_id, message, status)
  VALUES (p_user_id, p_property_id, p_message, 'pending')
  RETURNING id INTO new_inquiry_id;
  
  RETURN new_inquiry_id;
END;
$$;

-- 3. Grant public access to this specific RPC so even unconfirmed/demo users can use it
GRANT EXECUTE ON FUNCTION public.insert_inquiry_rpc(UUID, UUID, TEXT) TO authenticated, anon;

-- 4. Ensure RLS doesn't block the RPC's internal INSERT
-- (Already handled by SECURITY DEFINER, but good to ensure policies exist)
DROP POLICY IF EXISTS "Enable all inserts via RPC" ON public.inquiries;
CREATE POLICY "Enable all inserts via RPC" ON public.inquiries FOR INSERT WITH CHECK (true);
