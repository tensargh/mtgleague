-- Migration 029: Force Schema Recognition for result column
-- This migration will force Supabase to recognize the result column

-- First, let's check what we actually have
DO $$
BEGIN
    RAISE NOTICE 'Checking current schema state...';
    
    -- Check if the column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'top8_matches' 
        AND column_name = 'result'
    ) THEN
        RAISE NOTICE 'result column exists in database';
    ELSE
        RAISE NOTICE 'result column does NOT exist in database';
    END IF;
    
    -- Check enum type
    IF EXISTS (
        SELECT 1 FROM pg_type 
        WHERE typname = 'top8_result'
    ) THEN
        RAISE NOTICE 'top8_result enum exists';
    ELSE
        RAISE NOTICE 'top8_result enum does NOT exist';
    END IF;
END $$;

-- Drop and recreate the result column to force recognition
ALTER TABLE top8_matches DROP COLUMN IF EXISTS result;

-- Recreate the column with explicit type
ALTER TABLE top8_matches ADD COLUMN result top8_result;

-- Add a comment to make it more visible to Supabase
COMMENT ON COLUMN top8_matches.result IS 'Match result: player1_win or player2_win';

-- Force a table scan to update statistics
ANALYZE top8_matches;

-- Notify Supabase about the schema change
SELECT pg_notify('supabase_schema_refresh', 'top8_matches_updated'); 