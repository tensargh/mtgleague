-- Migration 026: Simple Diagnose Result Column
-- This migration returns diagnostic information as query results

-- Check what columns exist in top8_matches
SELECT 
    column_name, 
    data_type, 
    udt_name,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'top8_matches'
ORDER BY ordinal_position;

-- Check what enum types exist
SELECT 
    typname as enum_name,
    enumlabel as enum_value
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typtype = 'e'
ORDER BY typname, e.enumsortorder;

-- Check if result column exists and its type
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'top8_matches' 
            AND column_name = 'result'
        ) THEN 'EXISTS'
        ELSE 'MISSING'
    END as result_column_status,
    
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'top8_matches' 
            AND column_name = 'result'
        ) THEN (
            SELECT data_type 
            FROM information_schema.columns 
            WHERE table_name = 'top8_matches' 
            AND column_name = 'result'
        )
        ELSE 'N/A'
    END as result_column_type; 