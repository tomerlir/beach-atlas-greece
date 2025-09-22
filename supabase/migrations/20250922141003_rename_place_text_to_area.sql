-- Rename place_text column to area and clean data by removing ", Greece"

-- First, update all existing data to remove ", Greece" suffix
UPDATE public.beaches 
SET place_text = TRIM(TRAILING ', Greece' FROM place_text)
WHERE area LIKE '%, Greece';

-- Rename the column from place_text to area
ALTER TABLE public.beaches 
RENAME COLUMN place_text TO area;

-- Add a comment to the new column for clarity
COMMENT ON COLUMN public.beaches.area IS 'Geographic area or region where the beach is located (e.g., "Chania, Crete")';
