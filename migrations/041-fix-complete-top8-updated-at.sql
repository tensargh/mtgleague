-- Migration 041: Fix complete_top8 function updated_at issue
-- This migration fixes the complete_top8 function to handle the updated_at column properly

-- Drop and recreate the complete_top8 function with explicit column handling
DROP FUNCTION IF EXISTS complete_top8(UUID);

CREATE OR REPLACE FUNCTION complete_top8(p_top8_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_season_id UUID;
    v_unfinished_matches INTEGER;
    v_total_matches INTEGER;
    v_matches_with_results INTEGER;
    v_matches_without_results INTEGER;
    v_result JSONB;
BEGIN
    -- Validate input
    IF p_top8_id IS NULL THEN
        RAISE EXCEPTION 'Top 8 ID cannot be null';
    END IF;

    -- Check if top8 exists
    SELECT season_id INTO v_season_id FROM top8s WHERE id = p_top8_id;
    IF v_season_id IS NULL THEN
        RAISE EXCEPTION 'Top 8 tournament not found with ID: %', p_top8_id;
    END IF;

    -- Get match statistics for debugging
    SELECT COUNT(*) INTO v_total_matches FROM top8_matches WHERE top8_id = p_top8_id;
    SELECT COUNT(*) INTO v_matches_with_results FROM top8_matches WHERE top8_id = p_top8_id AND result IS NOT NULL;
    SELECT COUNT(*) INTO v_matches_without_results FROM top8_matches WHERE top8_id = p_top8_id AND result IS NULL;

    RAISE NOTICE 'Top 8 ID: %, Total matches: %, With results: %, Without results: %', 
        p_top8_id, v_total_matches, v_matches_with_results, v_matches_without_results;

    -- Check if all matches have results
    IF v_matches_without_results > 0 THEN
        v_result := jsonb_build_object(
            'success', false,
            'error', format('Cannot complete top8: % matches still need results', v_matches_without_results),
            'total_matches', v_total_matches,
            'matches_with_results', v_matches_with_results,
            'matches_without_results', v_matches_without_results
        );
        RETURN v_result;
    END IF;

    -- Update top8 status to completed
    UPDATE top8s 
    SET status = 'completed', completed_at = NOW()
    WHERE id = p_top8_id;

    -- Mark season as completed (explicitly specify columns to avoid updated_at issues)
    UPDATE seasons 
    SET status = 'completed', completed_at = NOW()
    WHERE id = v_season_id;

    -- Update winner_id for all matches based on results
    UPDATE top8_matches 
    SET winner_id = CASE 
        WHEN result IN ('2-0', '2-1') THEN player1_id
        WHEN result IN ('0-2', '1-2') THEN player2_id
        ELSE NULL
    END
    WHERE top8_id = p_top8_id;

    v_result := jsonb_build_object(
        'success', true,
        'message', 'Top 8 tournament completed successfully',
        'top8_id', p_top8_id,
        'season_id', v_season_id,
        'total_matches', v_total_matches
    );

    RAISE NOTICE 'Top 8 tournament completed successfully: %', v_result;
    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        v_result := jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'detail', SQLSTATE
        );
        RAISE NOTICE 'Error completing Top 8: %', v_result;
        RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION complete_top8(UUID) TO authenticated; 