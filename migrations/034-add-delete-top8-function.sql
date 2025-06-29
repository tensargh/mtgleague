-- Migration 034: Add ability to delete Top 8 tournaments
-- This migration adds a function to delete Top 8 tournaments and their matches

-- Function to delete a top8 tournament and all its matches
CREATE OR REPLACE FUNCTION delete_top8(p_top8_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_season_id UUID;
    v_season_status TEXT;
BEGIN
    -- Get the season ID and status
    SELECT season_id, s.status INTO v_season_id, v_season_status
    FROM top8s t
    JOIN seasons s ON t.season_id = s.id
    WHERE t.id = p_top8_id;
    
    IF v_season_id IS NULL THEN
        RAISE EXCEPTION 'Top 8 tournament not found';
    END IF;
    
    -- Check if season is already completed
    IF v_season_status = 'completed' THEN
        RAISE EXCEPTION 'Cannot delete Top 8 for a completed season';
    END IF;
    
    -- Delete all matches first (due to foreign key constraints)
    DELETE FROM top8_matches WHERE top8_id = p_top8_id;
    
    -- Delete the top8 record
    DELETE FROM top8s WHERE id = p_top8_id;
    
    RAISE NOTICE 'Deleted Top 8 tournament ID: % and all its matches', p_top8_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION delete_top8(UUID) TO authenticated; 