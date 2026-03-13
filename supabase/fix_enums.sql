-- ============================================================
-- ENUM REPAIR SCRIPT
-- Fixes "invalid input value for enum inquiry_status" errors
-- ============================================================

-- 1. Add 'approved' and 'rejected' to inquiry_status enum if they don't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'inquiry_status' AND e.enumlabel = 'approved') THEN
        ALTER TYPE public.inquiry_status ADD VALUE 'approved';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'inquiry_status' AND e.enumlabel = 'rejected') THEN
        ALTER TYPE public.inquiry_status ADD VALUE 'rejected';
    END IF;
END $$;

-- 2. Ensure property_status enum includes 'sold'
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'property_status' AND e.enumlabel = 'sold') THEN
        ALTER TYPE public.property_status ADD VALUE 'sold';
    END IF;
END $$;

-- 3. Double check the list of all property statuses just in case
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'property_status' AND e.enumlabel = 'pending') THEN
        -- This should already exist, but for safety:
        NULL; 
    END IF;
END $$;

-- 4. Re-verify the RPCs that use these enums
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
