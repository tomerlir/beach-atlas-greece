-- Secure profiles table RLS policies
-- This migration ensures comprehensive security for the profiles table

-- First, ensure RLS is enabled on the profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to ensure clean state
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;

-- Create comprehensive RLS policies for profiles table

-- 1. SELECT Policy: Users can only view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

-- 2. UPDATE Policy: Users can only update their own profile
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 3. INSERT Policy: Users can only insert their own profile
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 4. DELETE Policy: Users can only delete their own profile
CREATE POLICY "Users can delete their own profile" 
ON public.profiles 
FOR DELETE 
TO authenticated
USING (user_id = auth.uid());

-- Add comments for documentation
COMMENT ON POLICY "Users can view their own profile" ON public.profiles IS 
'Ensures users can only access their own profile data, preventing unauthorized access to email addresses';

COMMENT ON POLICY "Users can update their own profile" ON public.profiles IS 
'Allows users to update only their own profile information';

COMMENT ON POLICY "Users can insert their own profile" ON public.profiles IS 
'Enables users to create their own profile during registration';

COMMENT ON POLICY "Users can delete their own profile" ON public.profiles IS 
'Allows users to delete their own profile if needed';

-- Verify the policies are in place
DO $$
BEGIN
    -- Check if all policies exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles' 
        AND policyname = 'Users can view their own profile'
    ) THEN
        RAISE EXCEPTION 'SELECT policy not created successfully';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles' 
        AND policyname = 'Users can update their own profile'
    ) THEN
        RAISE EXCEPTION 'UPDATE policy not created successfully';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles' 
        AND policyname = 'Users can insert their own profile'
    ) THEN
        RAISE EXCEPTION 'INSERT policy not created successfully';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles' 
        AND policyname = 'Users can delete their own profile'
    ) THEN
        RAISE EXCEPTION 'DELETE policy not created successfully';
    END IF;
    
    RAISE NOTICE 'All RLS policies for profiles table created successfully';
END $$;
