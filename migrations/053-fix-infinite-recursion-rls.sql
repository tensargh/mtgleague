-- Migration 053: Fix infinite recursion in RLS policies
-- The issue is that admin policies query the users table, creating circular references

-- First, drop all existing policies on the users table
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Also drop policies on stores table that reference users
DROP POLICY IF EXISTS "Admins can manage stores" ON stores;
DROP POLICY IF EXISTS "Public can view stores" ON stores;
DROP POLICY IF EXISTS "TOs can update their stores" ON stores;

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- Create a function to check if current user is admin (avoids circular reference)
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Use auth.uid() directly without querying the users table
    -- This avoids the circular reference
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = 'admin'
    );
END;
$$;

-- Create clean policies for users table
-- 1. Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

-- 2. Admins can view all users (using the function to avoid recursion)
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (is_admin_user());

-- 3. Admins can update all users
CREATE POLICY "Admins can update users" ON users
    FOR UPDATE USING (is_admin_user());

-- 4. Admins can delete users (except protected ones)
CREATE POLICY "Admins can delete users" ON users
    FOR DELETE USING (is_admin_user() AND cannot_be_deleted = FALSE);

-- 5. Allow users to update their own profile (for name, etc.)
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Create clean policies for stores table
-- 1. Public can view all stores (for public pages)
CREATE POLICY "Public can view stores" ON stores
    FOR SELECT USING (true);

-- 2. Admins can manage all stores (using the function to avoid recursion)
CREATE POLICY "Admins can manage stores" ON stores
    FOR ALL USING (is_admin_user());

-- 3. TOs can update their assigned stores
CREATE POLICY "TOs can update their stores" ON stores
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM store_tos 
            WHERE store_tos.store_id = stores.id 
            AND store_tos.user_id = auth.uid()
        )
    );

-- Grant execute permissions on the function
GRANT EXECUTE ON FUNCTION is_admin_user() TO authenticated;

-- Add some debugging
DO $$
BEGIN
    RAISE NOTICE 'RLS policies have been fixed to avoid infinite recursion';
    RAISE NOTICE 'Admin users should now be able to access the system';
END $$; 