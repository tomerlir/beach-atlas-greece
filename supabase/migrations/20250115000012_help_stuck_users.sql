-- Help users who are stuck in email verification state
-- This migration provides a way to manually verify users who are stuck waiting for emails

-- Create a function to manually verify a user's email (admin only)
CREATE OR REPLACE FUNCTION public.manual_verify_user_email(target_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  target_user_id UUID;
BEGIN
  -- Only admins can manually verify users
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can manually verify user emails';
  END IF;
  
  -- Find the user by email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = target_email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', target_email;
  END IF;
  
  -- Manually set email_confirmed_at to now()
  UPDATE auth.users
  SET email_confirmed_at = now()
  WHERE id = target_user_id;
  
  -- Log the action
  PERFORM public.log_admin_action('manual_verify_user_email', target_user_id, jsonb_build_object('email', target_email));
  
  RETURN TRUE;
END;
$function$;

-- Add comment for documentation
COMMENT ON FUNCTION public.manual_verify_user_email(TEXT) IS 'Manually verifies a user email. Admin-only function for helping users stuck in verification state.';
