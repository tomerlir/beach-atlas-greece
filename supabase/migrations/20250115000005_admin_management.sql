-- Secure admin management system
-- This migration creates a secure way to manage admin roles

-- Create a function to promote users to admin (only callable by existing admins)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to demote admins to regular users (only callable by existing admins)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to list all users (admin only)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON FUNCTION public.promote_to_admin(UUID) IS 
'Promotes a user to admin role. Only callable by existing admins.';

COMMENT ON FUNCTION public.demote_from_admin(UUID) IS 
'Demotes an admin to regular user role. Only callable by existing admins. Prevents self-demotion.';

COMMENT ON FUNCTION public.get_all_users() IS 
'Returns a list of all users with their roles. Only callable by admins.';

-- Create a secure way to bootstrap the first admin
-- This function can only be called when no admins exist
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.bootstrap_first_admin(TEXT) IS 
'Creates the first admin user. Can only be called when no admins exist.';

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.promote_to_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.demote_from_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.bootstrap_first_admin(TEXT) TO authenticated;
