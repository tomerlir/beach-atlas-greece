-- Fix admin system consistency issues
-- This migration ensures all admin functions work correctly with the current schema

-- 1. Ensure the is_admin function works with both user_roles and profiles tables
-- Note: Using CREATE OR REPLACE to avoid dropping dependencies
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  -- Check both user_roles table (new) and profiles table (legacy) for admin role
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'::public.app_role
  ) OR EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN auth.users au ON au.id = p.user_id
    WHERE p.user_id = auth.uid() 
    AND p.role = 'admin'
    AND au.email_confirmed_at IS NOT NULL
    AND au.deleted_at IS NULL
  );
END;
$function$;

-- 2. Update promote_to_admin to work with both systems
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
  
  -- Add to user_roles table (primary system)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Update profiles table for backward compatibility
  UPDATE public.profiles 
  SET role = 'admin', updated_at = now()
  WHERE user_id = target_user_id;
  
  -- If profile doesn't exist, create it
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

-- 3. Update demote_from_admin to work with both systems
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
    SELECT 1 FROM public.user_roles 
    WHERE user_id = target_user_id AND role = 'admin'::public.app_role
  ) AND NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = target_user_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Target user is not an admin';
  END IF;
  
  -- Remove from user_roles table
  DELETE FROM public.user_roles 
  WHERE user_id = target_user_id AND role = 'admin'::public.app_role;
  
  -- Update profiles table
  UPDATE public.profiles 
  SET 
    role = 'user',
    updated_at = now()
  WHERE user_id = target_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Update accept_admin_invite to work with both systems
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

  -- Add admin role to user_roles table (primary system)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (current_user_id, 'admin'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Update profiles table for backward compatibility
  UPDATE public.profiles 
  SET role = 'admin', updated_at = now()
  WHERE user_id = current_user_id;
  
  -- If profile doesn't exist, create it
  INSERT INTO public.profiles (user_id, email, role)
  VALUES (current_user_id, current_email, 'admin')
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    role = 'admin',
    updated_at = now();

  -- Mark invite as accepted
  UPDATE public.admin_invites
  SET accepted = TRUE, accepted_at = now()
  WHERE token = invite_token;

  -- Log the action
  PERFORM public.log_admin_action('accept_admin_invite', current_user_id, jsonb_build_object('email', current_email));

  RETURN TRUE;
END;
$function$;

-- Add comments for documentation
COMMENT ON FUNCTION public.is_admin() IS 'Checks if current user is admin using both user_roles and profiles tables for compatibility';
COMMENT ON FUNCTION public.promote_to_admin(UUID) IS 'Promotes user to admin role in both user_roles and profiles tables';
COMMENT ON FUNCTION public.demote_from_admin(UUID) IS 'Demotes admin user in both user_roles and profiles tables';
COMMENT ON FUNCTION public.accept_admin_invite(UUID) IS 'Accepts admin invite and promotes user in both systems';
