-- ============================================================
-- FIX: Strict Admin & Agent Roles Update and Cleanup
-- ============================================================

-- 1. Redefine the function to ONLY accept the specific two emails
CREATE OR REPLACE FUNCTION public.sync_user_role(p_user_id UUID, p_email TEXT, p_role public.app_role)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Strict, hardcoded roles regardless of what the user passes in
  IF p_email = 'sdcreation613@gmail.com' THEN
    p_role := 'admin';
  ELSIF p_email = 'agent@gmail.com' THEN
    p_role := 'agent';
  ELSE
    p_role := 'user';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_user_id, p_role)
  ON CONFLICT (user_id, role) DO UPDATE SET role = EXCLUDED.role;
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_user_role(UUID, TEXT, public.app_role) TO authenticated;

-- 2. DANGEROUS BUT NECESSARY: Wipe out all old admin/agent permissions 
-- generated from the previous loose rules ('admin@...', '.includes(agent)').
DELETE FROM public.user_roles WHERE role IN ('admin', 'agent');

-- 3. The correct roles will be instantly re-assigned to 'sdcreation613@gmail.com' 
-- and 'agent@gmail.com' the very next time they log in or hit refresh!
