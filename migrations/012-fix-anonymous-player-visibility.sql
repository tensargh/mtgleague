-- Migration 012: Fix Anonymous Player Visibility
-- Update RLS policies to allow anonymous users to see private players
-- (the frontend will handle displaying them as "Anonymous")

-- Drop the existing public policy that filters out private players
DROP POLICY IF EXISTS "Public can view public players" ON players;

-- Create new policy that allows anonymous users to see all non-deleted players
-- The frontend will handle displaying private players as "Anonymous"
CREATE POLICY "Public can view all non-deleted players" ON players
    FOR SELECT USING (
        deleted_at IS NULL
    );

-- Update leg_results policy to allow anonymous users to see all results from completed legs
-- This ensures private players' results are visible (frontend will anonymize names)
DROP POLICY IF EXISTS "Public can view completed leg results" ON leg_results;

CREATE POLICY "Public can view completed leg results" ON leg_results
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM legs 
            WHERE legs.id = leg_results.leg_id 
            AND legs.status = 'completed'
        )
    );

-- Add comments explaining the policies
COMMENT ON POLICY "Public can view all non-deleted players" ON players IS 
'Allows anonymous users to see all non-deleted players. The frontend handles displaying private players as "Anonymous".';

COMMENT ON POLICY "Public can view completed leg results" ON leg_results IS 
'Allows anonymous users to see all results from completed legs, including private players. The frontend handles anonymizing private player names.'; 