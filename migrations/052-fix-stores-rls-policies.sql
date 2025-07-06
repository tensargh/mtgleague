-- Migration 052: Fix stores table RLS policies
-- Ensure admins can access stores and fix any conflicting policies

-- First, drop all existing policies on the stores table
DROP POLICY IF EXISTS "Admins can manage stores" ON stores;
DROP POLICY IF EXISTS "Public can view stores" ON stores;
DROP POLICY IF EXISTS "TOs can update their stores" ON stores;

-- Ensure RLS is enabled
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- Create clean, non-conflicting policies
-- 1. Public can view all stores (for public pages)
CREATE POLICY "Public can view stores" ON stores
    FOR SELECT USING (true);

-- 2. Admins can manage all stores (this is the key policy for admin access)
CREATE POLICY "Admins can manage stores" ON stores
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- 3. TOs can update their assigned stores
CREATE POLICY "TOs can update their stores" ON stores
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM store_tos 
            WHERE store_tos.store_id = stores.id 
            AND store_tos.user_id = auth.uid()
        )
    );

-- Add some debugging to help identify the issue
DO $$
BEGIN
    RAISE NOTICE 'Stores table RLS policies have been reset and recreated';
    RAISE NOTICE 'Admin users should now be able to access stores';
END $$; 