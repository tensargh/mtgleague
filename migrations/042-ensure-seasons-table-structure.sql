-- Migration 042: Ensure seasons table has correct structure
-- This migration ensures the seasons table has all required columns including updated_at

-- Add updated_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'seasons' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE seasons ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to seasons table';
    ELSE
        RAISE NOTICE 'updated_at column already exists in seasons table';
    END IF;
END $$;

-- Ensure the trigger function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop and recreate the trigger to ensure it's properly set up
DROP TRIGGER IF EXISTS update_seasons_updated_at ON seasons;
CREATE TRIGGER update_seasons_updated_at 
    BEFORE UPDATE ON seasons 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Force schema cache refresh
DO $$
BEGIN
    PERFORM 1 FROM seasons LIMIT 1;
    RAISE NOTICE 'Schema cache should be refreshed for seasons table';
END $$; 