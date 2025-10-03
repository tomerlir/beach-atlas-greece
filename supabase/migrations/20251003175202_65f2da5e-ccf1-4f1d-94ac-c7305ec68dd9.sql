-- Fix remaining security issues

-- =====================================================
-- 1. MAKE beaches_with_areas A SECURITY BARRIER VIEW
-- =====================================================
-- The view already filters to ACTIVE status, but we'll make it a security_barrier
-- for defense in depth. This ensures the filter happens before any other checks.

DROP VIEW IF EXISTS beaches_with_areas CASCADE;

CREATE VIEW beaches_with_areas 
WITH (security_barrier = true)
AS
SELECT 
  b.id,
  b.name,
  b.area,
  b.description,
  b.latitude,
  b.longitude,
  b.status,
  b.organized,
  b.blue_flag,
  b.parking,
  b.amenities,
  b.photo_url,
  b.created_at,
  b.updated_at,
  b.slug,
  b.type,
  b.wave_conditions,
  b.verified_at,
  b.source,
  b.photo_source,
  b.area_id,
  a.name AS area_name,
  a.slug AS area_slug,
  a.description AS area_description,
  a.hero_photo_url AS area_hero_photo_url,
  a.hero_photo_source AS area_hero_photo_source
FROM beaches b
LEFT JOIN areas a ON b.area_id = a.id
WHERE b.status = 'ACTIVE' AND a.status = 'ACTIVE';

-- Grant appropriate permissions
GRANT SELECT ON beaches_with_areas TO anon, authenticated;

-- =====================================================
-- 2. FIX MISSING search_path ON sync_profile_role
-- =====================================================

CREATE OR REPLACE FUNCTION public.sync_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  affected_user_id UUID;
BEGIN
  -- Determine which user_id was affected
  IF TG_OP = 'DELETE' THEN
    affected_user_id := OLD.user_id;
  ELSE
    affected_user_id := NEW.user_id;
  END IF;

  -- Update profiles.role based on user_roles
  UPDATE public.profiles
  SET role = CASE 
    WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = affected_user_id AND role = 'admin'::public.app_role)
    THEN 'admin'
    ELSE 'user'
  END
  WHERE user_id = affected_user_id;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;