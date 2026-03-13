-- ============================================================
-- FIX: Dashboard properties not showing for Admin/Agent
-- ============================================================

-- 0. CREATE HELPER FUNCTIONS FIRST (fixes the "function does not exist" error)
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_agent(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'agent'
  )
$$;

-- 1. Ensure the user with the admin email actually gets the 'admin' role in the database.
CREATE OR REPLACE FUNCTION public.sync_user_role(p_user_id UUID, p_email TEXT, p_role public.app_role)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Always enforce admin email
  IF p_email = 'sdcreation613@gmail.com' OR p_email LIKE 'admin@%' THEN
    p_role := 'admin';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_user_id, p_role)
  ON CONFLICT (user_id, role) DO UPDATE SET role = EXCLUDED.role;
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_user_role(UUID, TEXT, public.app_role) TO authenticated;

-- 2. Fix the properties policies so Agents can actually see and approve ALL pending properties.
DROP POLICY IF EXISTS "Agents can view own properties" ON public.properties;
DROP POLICY IF EXISTS "Admins can view all properties" ON public.properties;
DROP POLICY IF EXISTS "Agents and Admins can view all properties" ON public.properties;

CREATE POLICY "Agents and Admins can view all properties" 
  ON public.properties FOR SELECT TO authenticated 
  USING (public.is_agent(auth.uid()) OR public.is_admin(auth.uid()) OR auth.uid() = posted_by);

DROP POLICY IF EXISTS "Agents can update own properties" ON public.properties;
DROP POLICY IF EXISTS "Admins can update all properties" ON public.properties;
DROP POLICY IF EXISTS "Agents and Admins can update all properties" ON public.properties;

CREATE POLICY "Agents and Admins can update all properties" 
  ON public.properties FOR UPDATE TO authenticated 
  USING (public.is_agent(auth.uid()) OR public.is_admin(auth.uid()) OR auth.uid() = posted_by);

-- 3. Also fix properties deletion so Agent/Admin can reject/delete.
DROP POLICY IF EXISTS "Agents can delete own properties" ON public.properties;
DROP POLICY IF EXISTS "Admins can delete all properties" ON public.properties;
DROP POLICY IF EXISTS "Agents and Admins can delete all properties" ON public.properties;

CREATE POLICY "Agents and Admins can delete all properties" 
  ON public.properties FOR DELETE TO authenticated 
  USING (public.is_agent(auth.uid()) OR public.is_admin(auth.uid()) OR auth.uid() = posted_by);
