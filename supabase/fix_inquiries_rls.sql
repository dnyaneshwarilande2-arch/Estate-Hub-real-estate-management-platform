-- ============================================================
-- FIX: Inquiries RLS policy - allow any authenticated user to insert
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================

-- Step 1: Drop the existing strict INSERT policy
DROP POLICY IF EXISTS "Users can create inquiries" ON public.inquiries;

-- Step 2: Add a MORE PERMISSIVE insert policy
-- Allows ANY authenticated user to insert an inquiry, 
-- as long as they are logged in (auth.role() = 'authenticated')
-- The user_id field is still validated by the application layer.
CREATE POLICY "Authenticated users can create inquiries"
  ON public.inquiries
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Step 3: (Optional but recommended) Also create a SECURITY DEFINER
-- RPC function as a safe bypass if RLS still causes issues:
CREATE OR REPLACE FUNCTION public.insert_inquiry(
  p_property_id UUID,
  p_message TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.inquiries (user_id, property_id, message)
  VALUES (auth.uid(), p_property_id, p_message)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.insert_inquiry(UUID, TEXT) TO authenticated;
