-- Bypass email verification for admin invites
-- This migration allows admin invite acceptance without requiring email verification
-- since SMTP may not be configured in development/staging environments

-- Create a function to accept admin invite without email verification requirement
CREATE OR REPLACE FUNCTION public.accept_admin_invite_no_verification(invite_token UUID)
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

  -- Find invite (valid and not accepted/expired)
  SELECT email INTO target_email
  FROM public.admin_invites
  WHERE token = invite_token
    AND accepted = FALSE
    AND expires_at > now();

  IF target_email IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invite token';
  END IF;

  -- Get current user email
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
  PERFORM public.log_admin_action('accept_admin_invite_no_verification', current_user_id, jsonb_build_object('email', current_email));

  RETURN TRUE;
END;
$function$;

-- Add comment for documentation
COMMENT ON FUNCTION public.accept_admin_invite_no_verification(UUID) IS 'Accepts admin invite without requiring email verification. Use when SMTP is not configured.';
