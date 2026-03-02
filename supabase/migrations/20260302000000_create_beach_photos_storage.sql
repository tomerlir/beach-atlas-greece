-- Create the beach-photos storage bucket and RLS policies
-- Allows admins to upload/update/delete, and anyone to read (public bucket).
--
-- Admin check uses public.profiles (role = 'admin') which is the table
-- this project uses for role management. The check is inlined rather than
-- calling public.is_admin() because storage RLS runs in a context where
-- chained SECURITY DEFINER functions can fail to resolve tables.

-- 1. Create the bucket (public so getPublicUrl works without auth).
-- ON CONFLICT: update public=true in case the bucket already exists as private.
INSERT INTO storage.buckets (id, name, public)
VALUES ('beach-photos', 'beach-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Allow anyone to read files (public website needs to display images)
DROP POLICY IF EXISTS "Public read access on beach-photos" ON storage.objects;
CREATE POLICY "Public read access on beach-photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'beach-photos');

-- 3. Allow authenticated admins to upload files
DROP POLICY IF EXISTS "Admins can upload to beach-photos" ON storage.objects;
CREATE POLICY "Admins can upload to beach-photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'beach-photos'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  )
);

-- 4. Allow authenticated admins to update (overwrite) files
DROP POLICY IF EXISTS "Admins can update beach-photos" ON storage.objects;
CREATE POLICY "Admins can update beach-photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'beach-photos'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'beach-photos'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  )
);

-- 5. Allow authenticated admins to delete files
DROP POLICY IF EXISTS "Admins can delete from beach-photos" ON storage.objects;
CREATE POLICY "Admins can delete from beach-photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'beach-photos'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  )
);
