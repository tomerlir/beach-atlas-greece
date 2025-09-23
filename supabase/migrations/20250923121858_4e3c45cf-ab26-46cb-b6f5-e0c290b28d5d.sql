-- Fix the RLS policy for areas admin access - should check user_id, not id
DROP POLICY IF EXISTS "Allow admin full access to areas" ON public.areas;

CREATE POLICY "Allow admin full access to areas"
ON public.areas
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);