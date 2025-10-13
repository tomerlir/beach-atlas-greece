-- Remove 'parking' from amenities array now that parking is a dedicated field
-- Safe, idempotent transformation using array_remove

-- Up
UPDATE public.beaches
SET amenities = array_remove(amenities, 'parking')
WHERE amenities IS NOT NULL AND array_length(amenities, 1) IS NOT NULL AND 'parking' = ANY(amenities);

-- Down (no-op, cannot reliably re-add without data loss context)
-- Intentionally left blank


