-- Migration 025: Diagnose and Fix Result Column
-- This migration checks what's wrong with the result column and fixes it

-- Step 1: Check what columns exist in top8_matches
DO $$
DECLARE
    col_record RECORD;
BEGIN
    RAISE NOTICE 'Current columns in top8_matches table:';
    FOR col_record IN 
        SELECT column_name, data_type, udt_name
        FROM information_schema.columns 
        WHERE table_name = 'top8_matches'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '  %: % (udt: %)', col_record.column_name, col_record.data_type, col_record.udt_name;
    END LOOP;
END $$;

-- Step 2: Check what enum types exist
DO $$
DECLARE
    enum_record RECORD;
BEGIN
    RAISE NOTICE 'Current enum types:';
    FOR enum_record IN 
        SELECT typname, enumlabel
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typtype = 'e'
        ORDER BY typname, e.enumsortorder
    LOOP
        RAISE NOTICE '  %: %', enum_record.typname, enum_record.enumlabel;
    END LOOP;
END $$;

-- Step 3: Check the current result column type
DO $$
DECLARE
    result_type TEXT;
BEGIN
    SELECT data_type INTO result_type
    FROM information_schema.columns 
    WHERE table_name = 'top8_matches' 
    AND column_name = 'result';
    
    IF result_type IS NOT NULL THEN
        RAISE NOTICE 'result column exists with type: %', result_type;
        
        -- If it's not the right enum type, fix it
        IF result_type != 'USER-DEFINED' THEN
            RAISE NOTICE 'Fixing result column type...';
            ALTER TABLE top8_matches ALTER COLUMN result TYPE top8_result USING result::text::top8_result;
        END IF;
    ELSE
        RAISE NOTICE 'result column does not exist';
    END IF;
END $$; 