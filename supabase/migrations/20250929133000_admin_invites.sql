-- Admin Invites: allow existing admins to invite new admins by email

-- 1) Table
CREATE TABLE IF NOT EXISTS public.admin_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  email_lower TEXT GENERATED ALWAYS AS (lower(email)) STORED,
  token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  accepted BOOLEAN NOT NULL DEFAULT FALSE,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '14 days'),
  UNIQUE (email_lower)
);

ALTER TABLE public.admin_invites ENABLE ROW LEVEL SECURITY;

-- Only admins can view invites
CREATE POLICY "Admins can view admin_invites"
ON public.admin_invites
FOR SELECT
TO authenticated
USING (public.is_admin());

-- No direct INSERT/UPDATE/DELETE via RLS; use RPCs below

-- 2) RPC: create_admin_invite(invitee_email)
CREATE OR REPLACE FUNCTION public.create_admin_invite(invitee_email TEXT)
RETURNS UUID AS $$
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

  -- Upsert a pending invite for this email; refresh token if expired or consumed
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.create_admin_invite(TEXT) IS 'Creates or refreshes an admin invite for the given email. Admin-only. Returns the invite token.';

-- 3) RPC: accept_admin_invite(invite_token)
CREATE OR REPLACE FUNCTION public.accept_admin_invite(invite_token UUID)
RETURNS BOOLEAN AS $$
DECLARE
  target_email TEXT;
  current_email TEXT;
  current_user_id UUID;
BEGIN
  IF invite_token IS NULL THEN
    RAISE EXCEPTION 'Invite token is required';
  END IF;

  -- Must be authenticated to accept
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

  -- Promote user to admin (upsert profile)
  INSERT INTO public.profiles (user_id, email, role)
  VALUES (current_user_id, current_email, 'admin')
  ON CONFLICT (user_id)
  DO UPDATE SET role = 'admin', updated_at = now();

  -- Mark invite as accepted
  UPDATE public.admin_invites
  SET accepted = TRUE, accepted_at = now()
  WHERE token = invite_token;

  -- Audit log
  PERFORM public.log_admin_action('accept_admin_invite', current_user_id, jsonb_build_object('email', current_email));

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.accept_admin_invite(UUID) IS 'Accepts an admin invite for the current authenticated user. Promotes to admin if email matches invite.';

-- 4) RPC: list_admin_invites()
CREATE OR REPLACE FUNCTION public.list_admin_invites()
RETURNS TABLE (
  id UUID,
  email TEXT,
  invited_by UUID,
  accepted BOOLEAN,
  created_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
) AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  RETURN QUERY
  SELECT ai.id, ai.email, ai.invited_by, ai.accepted, ai.created_at, ai.expires_at
  FROM public.admin_invites ai
  ORDER BY ai.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.list_admin_invites() IS 'Lists admin invites. Admin-only.';

GRANT EXECUTE ON FUNCTION public.create_admin_invite(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_admin_invite(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_admin_invites() TO authenticated;


