-- Migration 028: Refresh Supabase Schema Cache
-- This migration forces Supabase to recognize the result column

-- Force Supabase to recognize the result column by doing a simple operation
-- This should refresh the schema cache
UPDATE top8_matches 
SET result = result 
WHERE result IS NOT NULL;

-- If no rows were updated, do a dummy operation to ensure the column is recognized
DO $$
BEGIN
    -- This will fail if the column doesn't exist, but that's what we want to test
    PERFORM result FROM top8_matches LIMIT 1;
    RAISE NOTICE 'result column is accessible and schema cache should be refreshed';
EXCEPTION
    WHEN undefined_column THEN
        RAISE EXCEPTION 'result column still not accessible - schema cache needs manual refresh';
END $$; 