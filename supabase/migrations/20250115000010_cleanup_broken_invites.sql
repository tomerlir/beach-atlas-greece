-- Clean up broken admin invites
-- This migration removes any existing admin invites so you can start fresh
-- with the fixed invitation system

-- Delete all existing admin invites
DELETE FROM public.admin_invites;

-- Add a comment for documentation
COMMENT ON TABLE public.admin_invites IS 'Admin invitation system - cleaned up on 2025-01-15 to fix token handling issues';
