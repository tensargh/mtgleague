-- Migration 038: Fix Top 8 structure - only 2 Semi-Final matches
-- This migration fixes the Top 8 to have the correct structure: 4 QF -> 2 SF -> 1 Final

-- Drop and recreate the create_top8_for_season function with correct match count
DROP FUNCTION IF EXISTS create_top8_for_season(UUID);

CREATE OR REPLACE FUNCTION create_top8_for_season(p_season_id UUID)
RETURNS UUID AS $$
DECLARE
    v_top8_id UUID;
BEGIN
    -- Check if top8 already exists for this season
    SELECT id INTO v_top8_id FROM top8s WHERE season_id = p_season_id;
    IF v_top8_id IS NOT NULL THEN
        RETURN v_top8_id;
    END IF;

    -- Create the top8 record
    INSERT INTO top8s (season_id, status)
    VALUES (p_season_id, 'pending')
    RETURNING id INTO v_top8_id;

    -- Create Quarter Finals (4 matches) - empty, will be seeded by frontend
    INSERT INTO top8_matches (top8_id, round, ordinal) VALUES
        (v_top8_id, 'qf', 1),
        (v_top8_id, 'qf', 2),
        (v_top8_id, 'qf', 3),
        (v_top8_id, 'qf', 4);

    -- Create Semi Finals (2 matches) - empty, will be filled manually
    INSERT INTO top8_matches (top8_id, round, ordinal) VALUES
        (v_top8_id, 'sf', 1),
        (v_top8_id, 'sf', 2);

    -- Create Final (1 match) - empty, will be filled manually
    INSERT INTO top8_matches (top8_id, round, ordinal) VALUES
        (v_top8_id, 'final', 1);

    RAISE NOTICE 'Created Top 8 tournament with ID: %', v_top8_id;
    RAISE NOTICE 'Created 7 matches (4 QF + 2 SF + 1 Final)';

    RETURN v_top8_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_top8_for_season(UUID) TO authenticated; 