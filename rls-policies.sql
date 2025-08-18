-- Row Level Security Policies for Safe Stay Manager
-- Run these in your Supabase SQL Editor (Dashboard > SQL Editor)

-- Drop existing policies first (ignore errors if they don't exist)
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update any user" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to create profiles" ON public.users;
DROP POLICY IF EXISTS "Service role can do everything" ON public.users;

-- Enable RLS on users table (if not already enabled)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Helper: SECURITY DEFINER function to check admin without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.role = 'admin'
  );
$$;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- Policy 1: Allow users to read their own profile
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- Policy 2: Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Policy 3: Allow admins to view all users (via SECURITY DEFINER helper)
CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT USING (public.is_admin());

-- Policy 4: Allow admins to update any user (via SECURITY DEFINER helper)
CREATE POLICY "Admins can update any user" ON public.users
    FOR UPDATE USING (public.is_admin());

-- Policy 5: Allow authenticated users to insert new user records (for signup)
CREATE POLICY "Allow authenticated users to create profiles" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy 6: Allow service role to do everything (for server-side operations)
CREATE POLICY "Service role can do everything" ON public.users
    FOR ALL USING (auth.role() = 'service_role');

-- Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'users';

-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users';
