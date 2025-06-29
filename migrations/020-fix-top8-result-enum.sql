-- Migration 020: Fix Top 8 Result Enum
-- This migration updates the top8_result enum to include the correct values

-- First, let's check if the enum exists and what values it has
DO $$
BEGIN
    -- Check if the enum exists
    IF EXISTS (
        SELECT 1 FROM pg_type 
        WHERE typname = 'top8_result'
    ) THEN
        -- Drop the existing enum type and recreate it with correct values
        DROP TYPE IF EXISTS top8_result CASCADE;
        
        -- Create the enum with the correct values
        CREATE TYPE top8_result AS ENUM ('2-0', '2-1', '1-2', '0-2');
        
        RAISE NOTICE 'Recreated top8_result enum with correct values: 2-0, 2-1, 1-2, 0-2';
    ELSE
        -- Create the enum if it doesn't exist
        CREATE TYPE top8_result AS ENUM ('2-0', '2-1', '1-2', '0-2');
        
        RAISE NOTICE 'Created top8_result enum with values: 2-0, 2-1, 1-2, 0-2';
    END IF;
END $$;

-- Update the top8_matches table to use the correct enum type
ALTER TABLE top8_matches 
ALTER COLUMN result TYPE top8_result 
USING result::text::top8_result;

-- Add comment explaining the enum
COMMENT ON TYPE top8_result IS 'Possible results for top 8 matches: 2-0 (player1 wins 2-0), 2-1 (player1 wins 2-1), 1-2 (player2 wins 2-1), 0-2 (player2 wins 2-0)'; 