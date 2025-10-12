-- Fix admin invites function to include token field
-- This migration fixes the list_admin_invites function to return the token field
-- which is needed for generating proper invite links

-- Drop the existing function first to allow changing return type
DROP FUNCTION IF EXISTS public.list_admin_invites();

-- Create the list_admin_invites function with token field
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

-- Add comment for documentation
COMMENT ON FUNCTION public.list_admin_invites() IS 'Lists admin invites with token field. Admin-only. Returns all invite data including token for link generation.';
