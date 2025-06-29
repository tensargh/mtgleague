-- Migration 027: Fix Result Column Enum Values
-- This migration checks and fixes the top8_result enum values

-- First, let's see what values the current enum has
SELECT 
    typname as enum_name,
    enumlabel as enum_value
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typtype = 'e' AND typname = 'top8_result'
ORDER BY e.enumsortorder;

-- Now let's check if we need to fix the enum values
DO $$
DECLARE
    has_correct_values BOOLEAN := FALSE;
    enum_count INTEGER;
BEGIN
    -- Check if the enum has the correct values
    SELECT COUNT(*) INTO enum_count
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typtype = 'e' 
    AND typname = 'top8_result'
    AND enumlabel IN ('2-0', '2-1', '1-2', '0-2');
    
    has_correct_values := (enum_count = 4);
    
    IF has_correct_values THEN
        RAISE NOTICE 'top8_result enum already has correct values: 2-0, 2-1, 1-2, 0-2';
    ELSE
        RAISE NOTICE 'top8_result enum needs to be fixed. Current count of correct values: %', enum_count;
        
        -- Drop and recreate the enum with correct values
        DROP TYPE top8_result CASCADE;
        CREATE TYPE top8_result AS ENUM ('2-0', '2-1', '1-2', '0-2');
        
        RAISE NOTICE 'Recreated top8_result enum with correct values: 2-0, 2-1, 1-2, 0-2';
    END IF;
END $$;

-- Verify the enum values after the fix
SELECT 
    typname as enum_name,
    enumlabel as enum_value
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typtype = 'e' AND typname = 'top8_result'
ORDER BY e.enumsortorder; 