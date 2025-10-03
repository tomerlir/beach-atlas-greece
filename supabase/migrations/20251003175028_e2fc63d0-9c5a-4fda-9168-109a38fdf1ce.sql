-- COMPREHENSIVE SECURITY FIX MIGRATION
-- This migration addresses all critical security vulnerabilities identified in the security scan

-- =====================================================
-- 1. CREATE USER_ROLES TABLE (CRITICAL - Privilege Escalation Fix)
-- =====================================================
-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table with proper constraints
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Migrate existing admin data from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, role::public.app_role
FROM public.profiles
WHERE role = 'admin'
ON CONFLICT (user_id, role) DO NOTHING;

-- RLS policies for user_roles (strict - only admins can modify)
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can insert roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update roles" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- =====================================================
-- 2. CREATE SECURITY DEFINER FUNCTION (Prevents recursion)
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
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- =====================================================
-- 3. UPDATE is_admin() FUNCTION (Fix search_path + use new table)
-- =====================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  RETURN public.has_role(auth.uid(), 'admin'::public.app_role);
END;
$function$;

-- =====================================================
-- 4. UPDATE can_access_admin_functions() (Fix search_path)
-- =====================================================
CREATE OR REPLACE FUNCTION public.can_access_admin_functions()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  RETURN public.is_admin();
END;
$function$;

-- =====================================================
-- 5. UPDATE ALL ADMIN FUNCTIONS (Fix search_path)
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_current_user_email()
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  RETURN (
    SELECT p.email 
    FROM public.profiles p 
    WHERE p.user_id = auth.uid()
  );
END;
$function$;

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
  
  -- Insert into user_roles table
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN TRUE;
END;
$function$;

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
  
  -- Remove from user_roles table
  DELETE FROM public.user_roles 
  WHERE user_id = target_user_id AND role = 'admin'::public.app_role;
  
  RETURN TRUE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.bootstrap_first_admin(admin_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  admin_user_id UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Admin users already exist. Use promote_to_admin() instead.';
  END IF;
  
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = admin_email;
  
  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % does not exist', admin_email;
  END IF;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (admin_user_id, 'admin'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN TRUE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_users_for_admin()
RETURNS TABLE(user_id UUID, email TEXT, role TEXT, created_at TIMESTAMP WITH TIME ZONE, last_sign_in TIMESTAMP WITH TIME ZONE)
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
    COALESCE(ur.role::TEXT, 'user') as role,
    p.created_at,
    au.last_sign_in_at
  FROM public.profiles p
  JOIN auth.users au ON au.id = p.user_id
  LEFT JOIN public.user_roles ur ON ur.user_id = p.user_id AND ur.role = 'admin'::public.app_role
  WHERE au.deleted_at IS NULL
  ORDER BY p.created_at DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_management_data()
RETURNS TABLE(user_id UUID, role TEXT, created_at TIMESTAMP WITH TIME ZONE, last_sign_in TIMESTAMP WITH TIME ZONE, is_verified BOOLEAN)
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
    COALESCE(ur.role::TEXT, 'user') as role,
    p.created_at,
    au.last_sign_in_at,
    (au.email_confirmed_at IS NOT NULL) as is_verified
  FROM public.profiles p
  JOIN auth.users au ON au.id = p.user_id
  LEFT JOIN public.user_roles ur ON ur.user_id = p.user_id AND ur.role = 'admin'::public.app_role
  WHERE au.deleted_at IS NULL
  ORDER BY p.created_at DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS TABLE(user_id UUID, email TEXT, role TEXT, created_at TIMESTAMP WITH TIME ZONE, last_sign_in TIMESTAMP WITH TIME ZONE)
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
    COALESCE(ur.role::TEXT, 'user') as role,
    p.created_at,
    au.last_sign_in_at
  FROM public.profiles p
  JOIN auth.users au ON au.id = p.user_id
  LEFT JOIN public.user_roles ur ON ur.user_id = p.user_id AND ur.role = 'admin'::public.app_role
  ORDER BY p.created_at DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_admin_action(action_type TEXT, target_user_id UUID DEFAULT NULL, action_details JSONB DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  INSERT INTO public.admin_audit_log (admin_user_id, action, target_user_id, details)
  VALUES (auth.uid(), action_type, target_user_id, action_details);
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_admin_invite(invitee_email TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  normalized_email TEXT;
  invite_token UUID;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  IF invitee_email IS NULL OR trim(invitee_email) = '' THEN
    RAISE EXCEPTION 'Email is required';
  END IF;

  normalized_email := lower(trim(invitee_email));

  INSERT INTO public.admin_invites (email, invited_by)
  VALUES (normalized_email, auth.uid())
  ON CONFLICT (email_lower)
  DO UPDATE SET
    token = CASE 
              WHEN public.admin_invites.accepted = TRUE OR public.admin_invites.expires_at < now() 
              THEN gen_random_uuid() ELSE public.admin_invites.token 
            END,
    accepted = CASE 
                 WHEN public.admin_invites.accepted = TRUE THEN FALSE 
                 ELSE public.admin_invites.accepted 
               END,
    accepted_at = CASE 
                    WHEN public.admin_invites.accepted = TRUE THEN NULL 
                    ELSE public.admin_invites.accepted_at 
                  END,
    invited_by = auth.uid(),
    created_at = now(),
    expires_at = now() + interval '14 days'
  RETURNING token INTO invite_token;

  RETURN invite_token;
END;
$function$;

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

  -- Add admin role to user_roles table
  INSERT INTO public.user_roles (user_id, role)
  VALUES (current_user_id, 'admin'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  UPDATE public.admin_invites
  SET accepted = TRUE, accepted_at = now()
  WHERE token = invite_token;

  PERFORM public.log_admin_action('accept_admin_invite', current_user_id, jsonb_build_object('email', current_email));

  RETURN TRUE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.list_admin_invites()
RETURNS TABLE(id UUID, email TEXT, invited_by UUID, accepted BOOLEAN, created_at TIMESTAMP WITH TIME ZONE, expires_at TIMESTAMP WITH TIME ZONE)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  RETURN QUERY
  SELECT ai.id, ai.email, ai.invited_by, ai.accepted, ai.created_at, ai.expires_at
  FROM public.admin_invites ai
  ORDER BY ai.created_at DESC;
END;
$function$;

-- =====================================================
-- 6. UPDATE AREAS TABLE RLS POLICY (Use is_admin function)
-- =====================================================
DROP POLICY IF EXISTS "Allow admin full access to areas" ON public.areas;

CREATE POLICY "Allow admin full access to areas" ON public.areas
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================
-- 7. ADD AUDIT LOG INSERT POLICY
-- =====================================================
CREATE POLICY "System can log admin actions" ON public.admin_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (admin_user_id = auth.uid() AND public.is_admin());

-- =====================================================
-- 8. REMOVE ROLE COLUMN FROM PROFILES (Keep for backward compatibility in views)
-- =====================================================
-- Note: We keep the role column in profiles table for now to maintain backward compatibility
-- with existing queries, but update the trigger to sync from user_roles

-- Add trigger to keep profiles.role in sync with user_roles
CREATE OR REPLACE FUNCTION public.sync_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Update profiles.role based on user_roles
  UPDATE public.profiles
  SET role = CASE 
    WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.user_id AND role = 'admin'::public.app_role)
    THEN 'admin'
    ELSE 'user'
  END
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER sync_profile_role_after_user_role_change
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_role();

-- =====================================================
-- 9. REMOVE USER WRITE ACCESS TO ROLE IN PROFILES
-- =====================================================
-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Create new restricted policies that don't allow role modification
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND role = 'user');

CREATE POLICY "Users can update their own profile email only" ON public.profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND role = (SELECT role FROM public.profiles WHERE user_id = auth.uid()));

-- Admin policy for profile management
CREATE POLICY "Admins can manage all profiles" ON public.profiles
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());