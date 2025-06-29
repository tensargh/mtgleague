-- Migration 037: Fix Top 8 RLS and schema cache issues
-- This migration ensures RLS is properly enabled and refreshes schema cache

-- Ensure RLS is enabled on top8s table
ALTER TABLE top8s ENABLE ROW LEVEL SECURITY;

-- Ensure RLS is enabled on top8_matches table
ALTER TABLE top8_matches ENABLE ROW LEVEL SECURITY;

-- Drop and recreate RLS policies to ensure they're properly applied
DROP POLICY IF EXISTS "Public can view completed top8s" ON top8s;
DROP POLICY IF EXISTS "TOs can manage their store top8s" ON top8s;
DROP POLICY IF EXISTS "Admins can manage all top8s" ON top8s;

-- Recreate RLS policies for top8s
CREATE POLICY "Public can view completed top8s" ON top8s
    FOR SELECT USING (status = 'completed');

CREATE POLICY "TOs can manage their store top8s" ON top8s
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM store_tos st
            JOIN seasons s ON s.store_id = st.store_id
            WHERE s.id = top8s.season_id 
            AND st.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all top8s" ON top8s
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Drop and recreate RLS policies for top8_matches
DROP POLICY IF EXISTS "Public can view completed top8 matches" ON top8_matches;
DROP POLICY IF EXISTS "TOs can manage their store top8 matches" ON top8_matches;
DROP POLICY IF EXISTS "Admins can manage all top8 matches" ON top8_matches;

-- Recreate RLS policies for top8_matches
CREATE POLICY "Public can view completed top8 matches" ON top8_matches
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM top8s 
            WHERE top8s.id = top8_matches.top8_id 
            AND top8s.status = 'completed'
        )
    );

CREATE POLICY "TOs can manage their store top8 matches" ON top8_matches
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM store_tos st
            JOIN seasons s ON s.store_id = st.store_id
            JOIN top8s t ON t.season_id = s.id
            WHERE t.id = top8_matches.top8_id 
            AND st.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all top8 matches" ON top8_matches
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Force schema cache refresh by doing a dummy operation
DO $$
BEGIN
    -- This will force Supabase to recognize the tables and policies
    PERFORM 1 FROM top8s LIMIT 1;
    PERFORM 1 FROM top8_matches LIMIT 1;
    RAISE NOTICE 'Schema cache should be refreshed for top8s and top8_matches tables';
END $$; 