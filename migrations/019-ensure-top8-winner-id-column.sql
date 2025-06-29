-- Migration 019: Ensure Top 8 Winner ID Column Exists
-- This migration ensures the winner_id column exists in the top8_matches table

-- Add winner_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'top8_matches' 
        AND column_name = 'winner_id'
    ) THEN
        ALTER TABLE top8_matches 
        ADD COLUMN winner_id UUID REFERENCES players(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Added winner_id column to top8_matches table';
    ELSE
        RAISE NOTICE 'winner_id column already exists in top8_matches table';
    END IF;
END $$;

-- Add index for winner_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_top8_matches_winner_id ON top8_matches(winner_id);

-- Add comment explaining the column
COMMENT ON COLUMN top8_matches.winner_id IS 'Reference to the winning player of this match. Automatically set based on result.'; 