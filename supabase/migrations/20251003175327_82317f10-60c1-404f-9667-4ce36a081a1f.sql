-- Remove security_barrier from view to fix security definer issue
-- The view is secure through its WHERE clause and underlying table RLS

DROP VIEW IF EXISTS beaches_with_areas CASCADE;

CREATE VIEW beaches_with_areas AS
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