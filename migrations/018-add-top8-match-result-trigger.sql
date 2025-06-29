-- Migration 018: Add Top 8 Match Result Trigger
-- This migration adds automatic winner_id updates when match results are set

-- Function to update winner_id based on match result
CREATE OR REPLACE FUNCTION update_top8_match_winner()
RETURNS TRIGGER AS $$
BEGIN
    -- Update winner_id based on the result
    IF NEW.result IS NOT NULL THEN
        NEW.winner_id := CASE 
            WHEN NEW.result IN ('2-0', '2-1') THEN NEW.player1_id
            WHEN NEW.result IN ('0-2', '1-2') THEN NEW.player2_id
            ELSE NULL
        END;
    ELSE
        -- Clear winner_id if result is cleared
        NEW.winner_id := NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update winner_id when result changes
DROP TRIGGER IF EXISTS trigger_update_top8_match_winner ON top8_matches;
CREATE TRIGGER trigger_update_top8_match_winner
    BEFORE UPDATE ON top8_matches
    FOR EACH ROW
    EXECUTE FUNCTION update_top8_match_winner();

-- Also create trigger for INSERT to handle initial result setting
DROP TRIGGER IF EXISTS trigger_insert_top8_match_winner ON top8_matches;
CREATE TRIGGER trigger_insert_top8_match_winner
    BEFORE INSERT ON top8_matches
    FOR EACH ROW
    EXECUTE FUNCTION update_top8_match_winner();

-- Add comments explaining the functionality
COMMENT ON FUNCTION update_top8_match_winner() IS 'Automatically updates winner_id based on match result when result is set or changed';
COMMENT ON TRIGGER trigger_update_top8_match_winner ON top8_matches IS 'Automatically updates winner_id when match result is updated';
COMMENT ON TRIGGER trigger_insert_top8_match_winner ON top8_matches IS 'Automatically updates winner_id when match result is set during insert'; 