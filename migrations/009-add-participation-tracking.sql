-- Migration 009: Add participation tracking to leg_results
-- Run this in your Supabase SQL editor

-- Add participated column to leg_results table
ALTER TABLE leg_results 
ADD COLUMN IF NOT EXISTS participated BOOLEAN NOT NULL DEFAULT TRUE;

-- Add comment explaining the column
COMMENT ON COLUMN leg_results.participated IS 'Whether the player participated in this leg (used for tiebreakers)';

-- Create index for better performance on participation queries
CREATE INDEX IF NOT EXISTS idx_leg_results_participated ON leg_results(participated);

-- Update existing records to set participated = true where wins + draws + losses > 0
-- This ensures existing data is consistent
UPDATE leg_results 
SET participated = (wins + draws + losses) > 0 
WHERE participated IS NULL;

-- Add a check constraint to ensure data consistency
ALTER TABLE leg_results 
ADD CONSTRAINT check_participation_consistency 
CHECK (
    (participated = true AND (wins + draws + losses) > 0) OR 
    (participated = false AND wins = 0 AND draws = 0 AND losses = 0)
);

-- Create a function to help with participation counting for tiebreakers
CREATE OR REPLACE FUNCTION get_player_participation_count(
    p_player_id UUID,
    p_season_id UUID
) RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM leg_results lr
        JOIN legs l ON l.id = lr.leg_id
        WHERE lr.player_id = p_player_id 
        AND l.season_id = p_season_id
        AND lr.participated = true
    );
END;
$$ LANGUAGE plpgsql;

-- Create a function to get player standings with participation tiebreaker
CREATE OR REPLACE FUNCTION get_player_standings_with_tiebreaker(
    p_season_id UUID
) RETURNS TABLE (
    player_id UUID,
    player_name TEXT,
    total_points INTEGER,
    participation_count INTEGER,
    rank INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH player_totals AS (
        SELECT 
            p.id as player_id,
            p.name as player_name,
            COALESCE(SUM(lr.points), 0) as total_points,
            COALESCE(COUNT(CASE WHEN lr.participated = true THEN 1 END), 0) as participation_count
        FROM players p
        LEFT JOIN leg_results lr ON p.id = lr.player_id
        LEFT JOIN legs l ON lr.leg_id = l.id AND l.season_id = p_season_id
        WHERE p.store_id = (SELECT store_id FROM seasons WHERE id = p_season_id)
        GROUP BY p.id, p.name
    )
    SELECT 
        pt.player_id,
        pt.player_name,
        pt.total_points,
        pt.participation_count,
        ROW_NUMBER() OVER (
            ORDER BY 
                pt.total_points DESC,
                pt.participation_count DESC,
                pt.player_name ASC
        ) as rank
    FROM player_totals pt
    ORDER BY pt.total_points DESC, pt.participation_count DESC, pt.player_name ASC;
END;
$$ LANGUAGE plpgsql; 