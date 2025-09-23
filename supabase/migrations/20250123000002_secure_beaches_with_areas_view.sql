-- Fix the beaches_with_areas view to be a Security invoker view
-- This ensures the view respects RLS policies of the underlying tables

-- Drop and recreate the view as a Security invoker view
DROP VIEW IF EXISTS beaches_with_areas;

CREATE VIEW beaches_with_areas 
WITH (security_invoker = true) AS
SELECT 
    b.*,
    a.name as area_name,
    a.slug as area_slug,
    a.description as area_description,
    a.hero_photo_url as area_hero_photo_url,
    a.hero_photo_source as area_hero_photo_source
FROM beaches b
LEFT JOIN areas a ON b.area_id = a.id
WHERE b.status = 'ACTIVE' AND a.status = 'ACTIVE';

-- Grant access to the view
GRANT SELECT ON beaches_with_areas TO anon, authenticated;

-- Update the comment to reflect the security approach
COMMENT ON VIEW beaches_with_areas IS 'View that joins beaches with their area information for easy querying. Only shows active beaches with active areas. Uses security_invoker to respect RLS policies.';
