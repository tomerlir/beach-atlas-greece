-- Update profiles table structure and RLS policies for admin access

-- First, ensure the profiles table has the correct structure
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'user'));

-- Ensure user_id properly references auth.users
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'profiles_user_id_fkey' 
    AND table_name = 'profiles'
  ) THEN
    ALTER TABLE public.profiles 
      ADD CONSTRAINT profiles_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Make user_id unique to ensure one profile per user
ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);

-- Update RLS policies for profiles table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Users can view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (user_id = auth.uid());

-- Users can insert their own profile (needed for bootstrap)
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Update beaches RLS policies to use the is_admin function properly
DROP POLICY IF EXISTS "Admins can insert beaches" ON public.beaches;
DROP POLICY IF EXISTS "Admins can update beaches" ON public.beaches;
DROP POLICY IF EXISTS "Admins can delete beaches" ON public.beaches;
DROP POLICY IF EXISTS "Admins can view all beaches" ON public.beaches;

-- Create new admin policies for beaches
CREATE POLICY "Admins can insert beaches" 
ON public.beaches 
FOR INSERT 
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update beaches" 
ON public.beaches 
FOR UPDATE 
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can delete beaches" 
ON public.beaches 
FOR DELETE 
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can view all beaches" 
ON public.beaches 
FOR SELECT 
TO authenticated
USING (public.is_admin());