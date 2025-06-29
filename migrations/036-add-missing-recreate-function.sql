-- Migration 036: Add missing recreate_top8_matches function
-- This migration adds the function that the frontend is trying to call

-- Function to recreate Top 8 matches for a given top8_id
CREATE OR REPLACE FUNCTION recreate_top8_matches(p_top8_id UUID)
RETURNS VOID AS $$
DECLARE
    existing_matches INTEGER;
BEGIN
    -- Check if matches already exist
    SELECT COUNT(*) INTO existing_matches 
    FROM top8_matches 
    WHERE top8_id = p_top8_id;
    
    IF existing_matches > 0 THEN
        RAISE NOTICE 'Top 8 already has % matches. Deleting and recreating...', existing_matches;
        DELETE FROM top8_matches WHERE top8_id = p_top8_id;
    END IF;
    
    -- Create Quarter Finals (4 matches)
    INSERT INTO top8_matches (top8_id, round, ordinal) VALUES
        (p_top8_id, 'qf', 1),
        (p_top8_id, 'qf', 2),
        (p_top8_id, 'qf', 3),
        (p_top8_id, 'qf', 4);
    
    -- Create Semi Finals (4 matches)
    INSERT INTO top8_matches (top8_id, round, ordinal) VALUES
        (p_top8_id, 'sf', 1),
        (p_top8_id, 'sf', 2),
        (p_top8_id, 'sf', 3),
        (p_top8_id, 'sf', 4);
    
    -- Create Final (1 match)
    INSERT INTO top8_matches (top8_id, round, ordinal) VALUES
        (p_top8_id, 'final', 1);
    
    RAISE NOTICE 'Created 9 matches for Top 8 ID: %', p_top8_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION recreate_top8_matches(UUID) TO authenticated; 