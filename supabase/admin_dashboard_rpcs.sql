-- Run this in Supabase SQL Editor
CREATE OR REPLACE FUNCTION public.get_all_profiles_rpc()
RETURNS json
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  -- Returns all profiles with their roles as a JSON array
  SELECT json_agg(
    json_build_object(
      'user_id', p.user_id,
      'full_name', p.full_name,
      'bio', p.bio,
      'email', (SELECT email FROM auth.users u WHERE u.id = p.user_id),
      'user_roles', (
        SELECT json_agg(json_build_object('role', ur.role))
        FROM public.user_roles ur
        WHERE ur.user_id = p.user_id
      )
    )
  )
  FROM public.profiles p;
$$;

GRANT EXECUTE ON FUNCTION public.get_all_profiles_rpc() TO anon, authenticated;


CREATE OR REPLACE FUNCTION public.get_all_inquiries_rpc()
RETURNS json
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  -- Returns all inquiries with the attached property data
  SELECT json_agg(
    json_build_object(
      'id', i.id,
      'user_id', i.user_id,
      'property_id', i.property_id,
      'message', i.message,
      'status', i.status,
      'created_at', i.created_at,
      'properties', (
         SELECT json_build_object('title', pr.title, 'posted_by', pr.posted_by)
         FROM public.properties pr
         WHERE pr.id = i.property_id
      )
    ) ORDER BY i.created_at DESC
  )
  FROM public.inquiries i;
$$;

GRANT EXECUTE ON FUNCTION public.get_all_inquiries_rpc() TO anon, authenticated;
