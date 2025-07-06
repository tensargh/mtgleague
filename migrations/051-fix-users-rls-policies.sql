-- Migration 051: Fix users table RLS policies
-- Ensure admins can see all users and fix any conflicting policies

-- First, drop all existing policies on the users table
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Admins can manage users" ON users;

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create clean, non-conflicting policies
-- 1. Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

-- 2. Admins can view all users (this is the key policy for the admin page)
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- 3. Admins can update all users
CREATE POLICY "Admins can update users" ON users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- 4. Admins can delete users (except protected ones)
CREATE POLICY "Admins can delete users" ON users
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
        AND cannot_be_deleted = FALSE
    );

-- 5. Allow users to update their own profile (for name, etc.)
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Add some debugging to help identify the issue
DO $$
BEGIN
    RAISE NOTICE 'Users table RLS policies have been reset and recreated';
    RAISE NOTICE 'Admin users should now be able to see all users';
END $$; 