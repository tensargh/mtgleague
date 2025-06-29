-- Migration 032: Recreate Top 8 matches structure
-- This migration ensures all Top 8 rounds have proper matches

-- First, let's see what matches currently exist
DO $$
DECLARE
    top8_record RECORD;
    match_count INTEGER;
BEGIN
    RAISE NOTICE 'Checking existing Top 8 tournaments and matches...';
    
    FOR top8_record IN 
        SELECT id, season_id, status, created_at 
        FROM top8s 
        ORDER BY created_at DESC
    LOOP
        SELECT COUNT(*) INTO match_count 
        FROM top8_matches 
        WHERE top8_id = top8_record.id;
        
        RAISE NOTICE 'Top 8 ID: %, Season: %, Status: %, Matches: %', 
            top8_record.id, top8_record.season_id, top8_record.status, match_count;
            
        -- Show details of existing matches
        RAISE NOTICE 'Match details:';
        FOR match_record IN 
            SELECT id, round, ordinal, player1_id, player2_id, result, winner_id
            FROM top8_matches 
            WHERE top8_id = top8_record.id
            ORDER BY round, ordinal
        LOOP
            RAISE NOTICE '  Round: %, Ordinal: %, Player1: %, Player2: %, Result: %, Winner: %', 
                match_record.round, match_record.ordinal, 
                match_record.player1_id, match_record.player2_id, 
                match_record.result, match_record.winner_id;
        END LOOP;
    END LOOP;
END $$;

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
    
    -- Create Quarter Finals (8 matches)
    INSERT INTO top8_matches (top8_id, round, ordinal) VALUES
        (p_top8_id, 'qf', 1),
        (p_top8_id, 'qf', 2),
        (p_top8_id, 'qf', 3),
        (p_top8_id, 'qf', 4),
        (p_top8_id, 'qf', 5),
        (p_top8_id, 'qf', 6),
        (p_top8_id, 'qf', 7),
        (p_top8_id, 'qf', 8);
    
    -- Create Semi Finals (4 matches)
    INSERT INTO top8_matches (top8_id, round, ordinal) VALUES
        (p_top8_id, 'sf', 1),
        (p_top8_id, 'sf', 2),
        (p_top8_id, 'sf', 3),
        (p_top8_id, 'sf', 4);
    
    -- Create Final (1 match)
    INSERT INTO top8_matches (top8_id, round, ordinal) VALUES
        (p_top8_id, 'final', 1);
    
    RAISE NOTICE 'Created 13 matches for Top 8 ID: %', p_top8_id;
END;
$$ LANGUAGE plpgsql;

-- Function to recreate all Top 8 matches
CREATE OR REPLACE FUNCTION recreate_all_top8_matches()
RETURNS VOID AS $$
DECLARE
    top8_record RECORD;
BEGIN
    FOR top8_record IN 
        SELECT id FROM top8s 
        WHERE status != 'completed'
    LOOP
        PERFORM recreate_top8_matches(top8_record.id);
    END LOOP;
    
    RAISE NOTICE 'Recreated matches for all active Top 8 tournaments';
END;
$$ LANGUAGE plpgsql; 