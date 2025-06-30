-- Migration 043: Add reset_top8 function
-- This migration adds a function to reset a Top 8 tournament, clearing all players and results and setting the season back to active

CREATE OR REPLACE FUNCTION reset_top8(p_top8_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_season_id UUID;
BEGIN
    -- Get the season ID
    SELECT season_id INTO v_season_id FROM top8s WHERE id = p_top8_id;
    IF v_season_id IS NULL THEN
        RAISE EXCEPTION 'Top 8 tournament not found';
    END IF;

    -- Reset all matches: clear players, results, and winner
    UPDATE top8_matches
    SET player1_id = NULL,
        player2_id = NULL,
        result = NULL,
        winner_id = NULL
    WHERE top8_id = p_top8_id;

    -- Set top8 status to 'pending' and clear completed_at
    UPDATE top8s
    SET status = 'pending', completed_at = NULL
    WHERE id = p_top8_id;

    -- Set season status to 'active' and clear completed_at
    UPDATE seasons
    SET status = 'active', completed_at = NULL
    WHERE id = v_season_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION reset_top8(UUID) TO authenticated; 