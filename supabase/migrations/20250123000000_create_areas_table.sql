-- Create areas table
CREATE TABLE IF NOT EXISTS areas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  hero_photo_url TEXT,
  hero_photo_source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('DRAFT', 'HIDDEN', 'ACTIVE'))
);

-- Create index on slug for fast lookups
CREATE INDEX IF NOT EXISTS idx_areas_slug ON areas(slug);
CREATE INDEX IF NOT EXISTS idx_areas_status ON areas(status);

-- Add area_id column to beaches table
ALTER TABLE beaches ADD COLUMN IF NOT EXISTS area_id UUID REFERENCES areas(id) ON DELETE SET NULL;

-- Create index on area_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_beaches_area_id ON beaches(area_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_areas_updated_at 
    BEFORE UPDATE ON areas 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert existing areas from beaches table
INSERT INTO areas (name, slug, status)
SELECT DISTINCT 
    area,
    LOWER(REGEXP_REPLACE(REGEXP_REPLACE(area, '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '-', 'g')),
    'ACTIVE'
FROM beaches 
WHERE area IS NOT NULL 
AND area != ''
ON CONFLICT (name) DO NOTHING;

-- Update beaches table to reference the new areas
UPDATE beaches 
SET area_id = areas.id
FROM areas 
WHERE beaches.area = areas.name;

-- Add RLS policies for areas table
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active areas
CREATE POLICY "Allow public read access to active areas" ON areas
    FOR SELECT USING (status = 'ACTIVE');

-- Allow admin full access to areas
CREATE POLICY "Allow admin full access to areas" ON areas
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Add comment for documentation
COMMENT ON TABLE areas IS 'Areas/regions where beaches are located (e.g., Mykonos, Corfu, etc.)';
COMMENT ON COLUMN areas.slug IS 'URL-friendly identifier for the area (e.g., mykonos, corfu)';
COMMENT ON COLUMN areas.hero_photo_url IS 'Main photo URL for the area hero section';
COMMENT ON COLUMN areas.hero_photo_source IS 'Attribution/source for the hero photo';
COMMENT ON COLUMN beaches.area_id IS 'Foreign key reference to the areas table';
