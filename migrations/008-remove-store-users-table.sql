-- Migration 008: Remove store_users table and use store_tos
-- Run this in your Supabase SQL editor

-- First, migrate any existing data from store_users to store_tos
-- (assuming store_users only contains TO assignments)
INSERT INTO store_tos (store_id, user_id, assigned_at)
SELECT store_id, user_id, created_at
FROM store_users
WHERE role = 'to' OR role = 'tournament_organiser'
ON CONFLICT (store_id, user_id) DO NOTHING;

-- Drop the store_users table and its dependencies
DROP TABLE IF EXISTS store_users CASCADE;

-- Update the seasons table RLS policies to use store_tos instead of store_users
DROP POLICY IF EXISTS "TOs can view seasons for their store" ON seasons;
DROP POLICY IF EXISTS "TOs can create seasons for their store" ON seasons;
DROP POLICY IF EXISTS "TOs can update seasons for their store" ON seasons;

-- Recreate the policies using store_tos
CREATE POLICY "TOs can view seasons for their store" ON seasons
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM store_tos 
            WHERE store_tos.user_id = auth.uid() 
            AND store_tos.store_id = seasons.store_id
        )
    );

CREATE POLICY "TOs can create seasons for their store" ON seasons
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM store_tos 
            WHERE store_tos.user_id = auth.uid() 
            AND store_tos.store_id = seasons.store_id
        )
    );

CREATE POLICY "TOs can update seasons for their store" ON seasons
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM store_tos 
            WHERE store_tos.user_id = auth.uid() 
            AND store_tos.store_id = seasons.store_id
        )
    ); 