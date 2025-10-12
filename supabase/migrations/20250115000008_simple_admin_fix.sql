-- Simple admin system fix
-- This migration ensures the admin system works correctly

-- Fix the list_admin_invites function to include token field
DROP FUNCTION IF EXISTS public.list_admin_invites();

CREATE OR REPLACE FUNCTION public.list_admin_invites()
RETURNS TABLE(id UUID, email TEXT, invited_by UUID, accepted BOOLEAN, created_at TIMESTAMP WITH TIME ZONE, expires_at TIMESTAMP WITH TIME ZONE, token UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  RETURN QUERY
  SELECT ai.id, ai.email, ai.invited_by, ai.accepted, ai.created_at, ai.expires_at, ai.token
  FROM public.admin_invites ai
  ORDER BY ai.created_at DESC;
END;
$function$;

-- Mark the specific user's invite as accepted
UPDATE public.admin_invites 
SET 
  accepted = TRUE, 
  accepted_at = now()
WHERE email = 'sunjonsy@gmail.com' 
  AND accepted = FALSE;
