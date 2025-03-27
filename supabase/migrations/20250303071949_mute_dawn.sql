/*
  # Fix Profiles Table RLS Policies

  1. Changes
    - Update RLS policies for profiles table to allow authenticated users to insert data
    - Ensure proper access control for profiles table
  
  2. Security
    - Maintain security while allowing proper functionality
    - Ensure authenticated users can create and update their own profiles
*/

-- First check if policies exist before dropping them
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can view their own profile') THEN
        DROP POLICY "Users can view their own profile" ON profiles;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Admin can view all profiles') THEN
        DROP POLICY "Admin can view all profiles" ON profiles;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can insert their own profile') THEN
        DROP POLICY "Users can insert their own profile" ON profiles;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can update their own profile') THEN
        DROP POLICY "Users can update their own profile" ON profiles;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Authenticated users can view all profiles') THEN
        DROP POLICY "Authenticated users can view all profiles" ON profiles;
    END IF;
END
$$;

-- Create new policies with safe creation
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can view their own profile') THEN
        CREATE POLICY "Users can view their own profile"
        ON profiles
        FOR SELECT
        TO authenticated
        USING (auth.uid() = id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can insert their own profile') THEN
        CREATE POLICY "Users can insert their own profile"
        ON profiles
        FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid() = id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can update their own profile') THEN
        CREATE POLICY "Users can update their own profile"
        ON profiles
        FOR UPDATE
        TO authenticated
        USING (auth.uid() = id)
        WITH CHECK (auth.uid() = id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Authenticated users can view all profiles') THEN
        CREATE POLICY "Authenticated users can view all profiles"
        ON profiles
        FOR SELECT
        TO authenticated
        USING (true);
    END IF;
END
$$;