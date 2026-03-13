-- ============================================================
-- CLEANUP: Delete all properties submitted by the Admin
-- ============================================================

-- This will safely delete any property listed by someone with the 'admin' role, 
-- and typically any associated images/inquiries will cascade delete automatically.
DELETE FROM public.properties
WHERE posted_by IN (
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
);
