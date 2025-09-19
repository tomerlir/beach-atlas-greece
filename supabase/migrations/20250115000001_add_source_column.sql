-- Add source column to beaches table
ALTER TABLE public.beaches 
  ADD COLUMN IF NOT EXISTS source TEXT;

-- Add comment for clarity
COMMENT ON COLUMN public.beaches.source IS 'Data source (e.g., osm, manual, etc.)';
