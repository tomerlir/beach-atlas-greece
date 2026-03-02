-- Remove all dependencies on the user_roles table.
-- The user_roles table was dropped; admin role is stored in public.profiles.role (TEXT).
-- This migration rewrites every function that referenced user_roles to use profiles instead.

-- =====================================================
-- 1. FIX has_role() — was querying user_roles
-- =====================================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = _user_id
      AND role = _role::TEXT
  )
$$;

-- =====================================================
-- 2. FIX is_admin() — called has_role() → user_roles
--    Rewrite directly against profiles for one less hop
-- =====================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  )
$$;

-- can_access_admin_functions() delegates to is_admin(), no change needed
-- but recreate to be safe
CREATE OR REPLACE FUNCTION public.can_access_admin_functions()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT public.is_admin()
$$;

-- =====================================================
-- 3. FIX promote_to_admin() — was inserting into user_roles
-- =====================================================
CREATE OR REPLACE FUNCTION public.promote_to_admin(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can promote users to admin role';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id) THEN
    RAISE EXCEPTION 'Target user does not exist';
  END IF;

  INSERT INTO public.profiles (user_id, email, role)
  SELECT target_user_id, au.email, 'admin'
  FROM auth.users au
  WHERE au.id = target_user_id
  ON CONFLICT (user_id) DO UPDATE SET role = 'admin', updated_at = now();

  RETURN TRUE;
END;
$function$;

-- =====================================================
-- 4. FIX demote_from_admin() — was deleting from user_roles
-- =====================================================
CREATE OR REPLACE FUNCTION public.demote_from_admin(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can demote users from admin role';
  END IF;

  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Admins cannot demote themselves';
  END IF;

  UPDATE public.profiles
  SET role = 'user', updated_at = now()
  WHERE user_id = target_user_id;

  RETURN TRUE;
END;
$function$;

-- =====================================================
-- 5. FIX bootstrap_first_admin() — was checking/inserting user_roles
-- =====================================================
CREATE OR REPLACE FUNCTION public.bootstrap_first_admin(admin_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  admin_user_id UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin') THEN
    RAISE EXCEPTION 'Admin users already exist. Use promote_to_admin() instead.';
  END IF;

  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = admin_email;

  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % does not exist', admin_email;
  END IF;

  INSERT INTO public.profiles (user_id, email, role)
  VALUES (admin_user_id, admin_email, 'admin')
  ON CONFLICT (user_id) DO UPDATE SET role = 'admin', updated_at = now();

  RETURN TRUE;
END;
$function$;

-- =====================================================
-- 6. FIX get_users_for_admin() — was LEFT JOINing user_roles
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_users_for_admin()
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  role TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  last_sign_in TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
      AND email_confirmed_at IS NOT NULL
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin account must be verified and active';
  END IF;

  RETURN QUERY
  SELECT
    p.user_id,
    p.email,
    p.role,
    p.created_at,
    au.last_sign_in_at
  FROM public.profiles p
  JOIN auth.users au ON au.id = p.user_id
  WHERE au.deleted_at IS NULL
  ORDER BY p.created_at DESC;
END;
$function$;

-- =====================================================
-- 7. FIX get_user_management_data() — was LEFT JOINing user_roles
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_user_management_data()
RETURNS TABLE(
  user_id UUID,
  role TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  last_sign_in TIMESTAMP WITH TIME ZONE,
  is_verified BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  IF NOT public.can_access_admin_functions() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  RETURN QUERY
  SELECT
    p.user_id,
    p.role,
    p.created_at,
    au.last_sign_in_at,
    (au.email_confirmed_at IS NOT NULL) AS is_verified
  FROM public.profiles p
  JOIN auth.users au ON au.id = p.user_id
  WHERE au.deleted_at IS NULL
  ORDER BY p.created_at DESC;
END;
$function$;

-- =====================================================
-- 8. FIX get_all_users() — was LEFT JOINing user_roles
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  role TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  last_sign_in TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can view all users';
  END IF;

  RETURN QUERY
  SELECT
    p.user_id,
    p.email,
    p.role,
    p.created_at,
    au.last_sign_in_at
  FROM public.profiles p
  JOIN auth.users au ON au.id = p.user_id
  ORDER BY p.created_at DESC;
END;
$function$;

-- =====================================================
-- 9. FIX accept_admin_invite() — was inserting into user_roles
-- =====================================================
CREATE OR REPLACE FUNCTION public.accept_admin_invite(invite_token UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  target_email TEXT;
  current_email TEXT;
  current_user_id UUID;
BEGIN
  IF invite_token IS NULL THEN
    RAISE EXCEPTION 'Invite token is required';
  END IF;

  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Must be authenticated to accept invite';
  END IF;

  SELECT email INTO target_email
  FROM public.admin_invites
  WHERE token = invite_token
    AND accepted = FALSE
    AND expires_at > now();

  IF target_email IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invite token';
  END IF;

  SELECT email INTO current_email FROM auth.users WHERE id = current_user_id;

  IF lower(current_email) <> lower(target_email) THEN
    RAISE EXCEPTION 'Invite email does not match signed-in user';
  END IF;

  -- Grant admin role via profiles table
  INSERT INTO public.profiles (user_id, email, role)
  VALUES (current_user_id, current_email, 'admin')
  ON CONFLICT (user_id) DO UPDATE SET role = 'admin', updated_at = now();

  UPDATE public.admin_invites
  SET accepted = TRUE, accepted_at = now()
  WHERE token = invite_token;

  PERFORM public.log_admin_action(
    'accept_admin_invite',
    current_user_id,
    jsonb_build_object('email', current_email)
  );

  RETURN TRUE;
END;
$function$;

-- =====================================================
-- 10. DROP the orphaned sync_profile_role function
--     The trigger fired on user_roles which no longer exists,
--     so the trigger itself is already gone. Drop only the function.
-- =====================================================
DROP FUNCTION IF EXISTS public.sync_profile_role();
