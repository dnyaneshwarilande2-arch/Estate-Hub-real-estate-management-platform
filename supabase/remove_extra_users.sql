-- ============================================================
-- CLEANUP: Remove all users except Rohit, Hardik, Sai, Admin, and Agent
-- ============================================================

-- Delete from profiles where the name does not match Rohit, Hardik, or Sai
-- AND ensure we DO NOT delete the Admin or the Agent
DELETE FROM public.profiles
WHERE full_name ILIKE '%rohit%' IS FALSE
  AND full_name ILIKE '%hardik%' IS FALSE
  AND full_name ILIKE '%sai%' IS FALSE
  AND user_id NOT IN (
      -- Protect anyone who currently holds an 'admin' or 'agent' role
      SELECT user_id FROM public.user_roles WHERE role IN ('admin', 'agent')
  );
