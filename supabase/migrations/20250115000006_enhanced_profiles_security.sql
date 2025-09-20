-- Enhanced profiles table security
-- This migration adds additional security measures to prevent email harvesting

-- 1. Remove direct execute permissions from get_all_users function
-- Only allow admins to execute this function through a more secure approach
REVOKE EXECUTE ON FUNCTION public.get_all_users() FROM authenticated;

-- 2. Create a more secure admin-only function for user management
-- This function will be called only by verified admin users
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create a function to check if a user can access admin functions
-- This adds an extra layer of security
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
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 4. Update the is_admin function to be more secure
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
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 5. Create a secure function for admin user management that doesn't expose emails unnecessarily
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Add additional RLS policy to prevent any potential bypass
-- This ensures that even if someone tries to query profiles directly, they can't see other users' emails
CREATE POLICY "Strict user isolation" 
ON public.profiles 
FOR ALL 
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 7. Create a function to get user email only for the current user (for profile display)
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
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 8. Grant minimal necessary permissions
-- Only grant execute on the secure functions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_users_for_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_admin_functions() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_management_data() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_email() TO authenticated;

-- 9. Add comments for documentation
COMMENT ON FUNCTION public.get_users_for_admin() IS 
'Returns all user data for admin management. Requires verified admin account.';

COMMENT ON FUNCTION public.can_access_admin_functions() IS 
'Checks if current user can access admin functions. Requires verified admin account.';

COMMENT ON FUNCTION public.get_user_management_data() IS 
'Returns user management data without exposing emails unnecessarily. Admin only.';

COMMENT ON FUNCTION public.get_current_user_email() IS 
'Returns email address for current user only. Used for profile display.';

-- 10. Create an audit log for admin actions (optional but recommended)
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target_user_id UUID REFERENCES auth.users(id),
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" 
ON public.admin_audit_log 
FOR SELECT 
TO authenticated
USING (public.is_admin());

-- Function to log admin actions
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.log_admin_action(TEXT, UUID, JSONB) TO authenticated;

COMMENT ON FUNCTION public.log_admin_action(TEXT, UUID, JSONB) IS 
'Logs admin actions for audit purposes. Admin only.';
