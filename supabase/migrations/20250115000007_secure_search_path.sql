-- Security Enhancement: Add SET search_path = public to all database functions
-- This prevents search_path manipulation attacks by ensuring functions only look in the public schema

-- 1. Update get_users_for_admin function
CREATE OR REPLACE FUNCTION public.get_users_for_admin()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  role TEXT,
  created_at TIMESTAMPTZ,
  last_sign_in TIMESTAMPTZ
) AS $$
BEGIN
  -- Double-check admin status with additional verification
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  -- Additional security: Check if the admin user is active and verified
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
  WHERE au.deleted_at IS NULL  -- Only show active users
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Update can_access_admin_functions function
CREATE OR REPLACE FUNCTION public.can_access_admin_functions()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user is admin and account is verified
  RETURN EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN auth.users au ON au.id = p.user_id
    WHERE p.user_id = auth.uid() 
    AND p.role = 'admin'
    AND au.email_confirmed_at IS NOT NULL
    AND au.deleted_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- 3. Update get_user_management_data function
CREATE OR REPLACE FUNCTION public.get_user_management_data()
RETURNS TABLE (
  user_id UUID,
  role TEXT,
  created_at TIMESTAMPTZ,
  last_sign_in TIMESTAMPTZ,
  is_verified BOOLEAN
) AS $$
BEGIN
  -- Only allow verified admins
  IF NOT public.can_access_admin_functions() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  RETURN QUERY
  SELECT 
    p.user_id,
    p.role,
    p.created_at,
    au.last_sign_in_at,
    (au.email_confirmed_at IS NOT NULL) as is_verified
  FROM public.profiles p
  JOIN auth.users au ON au.id = p.user_id
  WHERE au.deleted_at IS NULL
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Update get_current_user_email function
CREATE OR REPLACE FUNCTION public.get_current_user_email()
RETURNS TEXT AS $$
BEGIN
  -- Only return email for the current authenticated user
  RETURN (
    SELECT p.email 
    FROM public.profiles p 
    WHERE p.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- 5. Update log_admin_action function
CREATE OR REPLACE FUNCTION public.log_admin_action(
  action_type TEXT,
  target_user_id UUID DEFAULT NULL,
  action_details JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Only allow admins to log actions
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  INSERT INTO public.admin_audit_log (admin_user_id, action, target_user_id, details)
  VALUES (auth.uid(), action_type, target_user_id, action_details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. Update promote_to_admin function
CREATE OR REPLACE FUNCTION public.promote_to_admin(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the current user is an admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can promote users to admin role';
  END IF;
  
  -- Check if target user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id) THEN
    RAISE EXCEPTION 'Target user does not exist';
  END IF;
  
  -- Update or insert admin profile
  INSERT INTO public.profiles (user_id, email, role)
  SELECT 
    target_user_id,
    au.email,
    'admin'
  FROM auth.users au
  WHERE au.id = target_user_id
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    role = 'admin',
    updated_at = now();
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7. Update demote_from_admin function
CREATE OR REPLACE FUNCTION public.demote_from_admin(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the current user is an admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can demote users from admin role';
  END IF;
  
  -- Prevent self-demotion (admins cannot demote themselves)
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Admins cannot demote themselves';
  END IF;
  
  -- Check if target user exists and is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = target_user_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Target user is not an admin';
  END IF;
  
  -- Demote to regular user
  UPDATE public.profiles 
  SET 
    role = 'user',
    updated_at = now()
  WHERE user_id = target_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 8. Update bootstrap_first_admin function
CREATE OR REPLACE FUNCTION public.bootstrap_first_admin(admin_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Check if any admins already exist
  IF EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin') THEN
    RAISE EXCEPTION 'Admin users already exist. Use promote_to_admin() instead.';
  END IF;
  
  -- Find the user by email
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = admin_email;
  
  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % does not exist', admin_email;
  END IF;
  
  -- Create admin profile
  INSERT INTO public.profiles (user_id, email, role)
  VALUES (admin_user_id, admin_email, 'admin')
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    role = 'admin',
    updated_at = now();
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 9. Update get_all_users function
CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  role TEXT,
  created_at TIMESTAMPTZ,
  last_sign_in TIMESTAMPTZ
) AS $$
BEGIN
  -- Check if the current user is an admin
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 10. Update is_admin function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Enhanced admin check with account verification
  RETURN EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN auth.users au ON au.id = p.user_id
    WHERE p.user_id = auth.uid() 
    AND p.role = 'admin'
    AND au.email_confirmed_at IS NOT NULL
    AND au.deleted_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Add comments documenting the security enhancement
COMMENT ON FUNCTION public.get_users_for_admin() IS 
'Returns all user data for admin management. Requires verified admin account. SECURE: Uses SET search_path = public.';

COMMENT ON FUNCTION public.can_access_admin_functions() IS 
'Checks if current user can access admin functions. Requires verified admin account. SECURE: Uses SET search_path = public.';

COMMENT ON FUNCTION public.get_user_management_data() IS 
'Returns user management data without exposing emails unnecessarily. Admin only. SECURE: Uses SET search_path = public.';

COMMENT ON FUNCTION public.get_current_user_email() IS 
'Returns email address for current user only. Used for profile display. SECURE: Uses SET search_path = public.';

COMMENT ON FUNCTION public.log_admin_action(TEXT, UUID, JSONB) IS 
'Logs admin actions for audit purposes. Admin only. SECURE: Uses SET search_path = public.';

COMMENT ON FUNCTION public.promote_to_admin(UUID) IS 
'Promotes a user to admin role. Only callable by existing admins. SECURE: Uses SET search_path = public.';

COMMENT ON FUNCTION public.demote_from_admin(UUID) IS 
'Demotes an admin to regular user role. Only callable by existing admins. Prevents self-demotion. SECURE: Uses SET search_path = public.';

COMMENT ON FUNCTION public.bootstrap_first_admin(TEXT) IS 
'Creates the first admin user. Can only be called when no admins exist. SECURE: Uses SET search_path = public.';

COMMENT ON FUNCTION public.get_all_users() IS 
'Returns a list of all users with their roles. Only callable by admins. SECURE: Uses SET search_path = public.';

COMMENT ON FUNCTION public.is_admin() IS 
'Checks if current user is admin with enhanced verification. SECURE: Uses SET search_path = public.';
