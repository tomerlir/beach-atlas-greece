-- Add some sample descriptions and hero photos for existing areas
UPDATE areas SET 
    description = CASE 
        WHEN name = 'Mykonos' THEN 'Discover the vibrant beaches of Mykonos, famous for their golden sands, crystal-clear waters, and lively atmosphere. From the iconic Paradise Beach to the tranquil Agios Sostis, Mykonos offers a diverse range of beach experiences.'
        WHEN name = 'Corfu' THEN 'Explore the stunning beaches of Corfu, where the Ionian Sea meets dramatic cliffs and lush landscapes. From family-friendly sandy shores to secluded coves, Corfu''s beaches offer something for every type of beach lover.'
        WHEN name = 'Lefkada' THEN 'Experience the breathtaking beaches of Lefkada, known for their dramatic white cliffs and turquoise waters. This Ionian island offers some of Greece''s most spectacular coastal scenery.'
        WHEN name = 'Naxos' THEN 'Discover the diverse beaches of Naxos, the largest of the Cyclades. From long sandy stretches perfect for families to windsurfing hotspots, Naxos offers a rich variety of coastal experiences.'
        WHEN name = 'Paros' THEN 'Explore the beautiful beaches of Paros, where traditional charm meets modern amenities. From the famous Golden Beach to hidden coves, Paros offers pristine waters and stunning natural beauty.'
        WHEN name = 'Santorini' THEN 'Experience the unique beaches of Santorini, famous for their volcanic origins and dramatic landscapes. From the red sands of Red Beach to the black pebbles of Perissa, Santorini offers unforgettable coastal experiences.'
        WHEN name = 'Crete' THEN 'Discover the diverse beaches of Crete, Greece''s largest island. From the famous pink sands of Elafonisi to the dramatic cliffs of Balos, Crete offers an incredible variety of coastal landscapes.'
        WHEN name = 'Rhodes' THEN 'Explore the beautiful beaches of Rhodes, where ancient history meets stunning coastlines. From the golden sands of Faliraki to the crystal-clear waters of Lindos, Rhodes offers diverse beach experiences.'
        ELSE 'A beautiful area in Greece with stunning beaches and crystal-clear waters.'
    END,
    hero_photo_url = CASE 
        WHEN name = 'Mykonos' THEN 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
        WHEN name = 'Corfu' THEN 'https://images.unsplash.com/photo-1571115764595-644a1f56a55c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
        WHEN name = 'Lefkada' THEN 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
        WHEN name = 'Naxos' THEN 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
        WHEN name = 'Paros' THEN 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
        WHEN name = 'Santorini' THEN 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
        WHEN name = 'Crete' THEN 'https://images.unsplash.com/photo-1571115764595-644a1f56a55c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
        WHEN name = 'Rhodes' THEN 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
        ELSE NULL
    END,
    hero_photo_source = CASE 
        WHEN name IN ('Mykonos', 'Corfu', 'Lefkada', 'Naxos', 'Paros', 'Santorini', 'Crete', 'Rhodes') THEN 'Unsplash'
        ELSE NULL
    END
WHERE name IN ('Mykonos', 'Corfu', 'Lefkada', 'Naxos', 'Paros', 'Santorini', 'Crete', 'Rhodes');

-- Verify all beaches have area_id set
UPDATE beaches 
SET area_id = areas.id
FROM areas 
WHERE beaches.area = areas.name 
AND beaches.area_id IS NULL;

-- Add a check constraint to ensure area_id is set for active beaches
ALTER TABLE beaches ADD CONSTRAINT check_area_id_for_active_beaches 
CHECK (
    (status = 'ACTIVE' AND area_id IS NOT NULL) OR 
    (status != 'ACTIVE')
);

-- Create a view for easy querying of beaches with area information
CREATE OR REPLACE VIEW beaches_with_areas AS
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

-- Add comment for documentation
COMMENT ON VIEW beaches_with_areas IS 'View that joins beaches with their area information for easy querying';
