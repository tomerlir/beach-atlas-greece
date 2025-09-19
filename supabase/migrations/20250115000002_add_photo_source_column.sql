-- Add photo_source column to beaches table for photo attributions
ALTER TABLE public.beaches 
  ADD COLUMN IF NOT EXISTS photo_source TEXT;

-- Add comment for clarity
COMMENT ON COLUMN public.beaches.photo_source IS 'Photo attribution/source (e.g., "dronepicr, CC BY 2.0 <https://creativecommons.org/licenses/by/2.0>, via Wikimedia Commons")';
