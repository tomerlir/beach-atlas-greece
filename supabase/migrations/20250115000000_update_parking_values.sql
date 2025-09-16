-- Update parking values from old format to new format
-- This migration updates the parking constraint and existing data

-- First, update existing data to use new parking values
UPDATE public.beaches 
SET parking = CASE 
  WHEN parking = 'none' THEN 'NONE'
  WHEN parking = 'limited' THEN 'SMALL_LOT'
  WHEN parking = 'ample' THEN 'LARGE_LOT'
  ELSE parking
END
WHERE parking IN ('none', 'limited', 'ample');

-- Drop the old constraint
ALTER TABLE public.beaches 
  DROP CONSTRAINT IF EXISTS beaches_parking_check;

-- Add the new constraint with updated values
ALTER TABLE public.beaches 
  ADD CONSTRAINT beaches_parking_check CHECK (parking IN ('NONE', 'ROADSIDE', 'SMALL_LOT', 'LARGE_LOT'));

-- Update the comment to reflect the new values
COMMENT ON COLUMN public.beaches.parking IS 'Parking availability: NONE, ROADSIDE, SMALL_LOT, LARGE_LOT';
