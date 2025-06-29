-- Migration 033: Fix Top 8 creation function
-- This migration fixes the seeding and ensures all rounds are created

-- Drop and recreate the create_top8_for_season function with proper seeding and all rounds
DROP FUNCTION IF EXISTS create_top8_for_season(UUID);

CREATE OR REPLACE FUNCTION create_top8_for_season(p_season_id UUID)
RETURNS UUID AS $$
DECLARE
    v_top8_id UUID;
    v_best_legs_count INTEGER;
    v_top8_players UUID[] := ARRAY[]::UUID[];
    v_player_id UUID;
    v_rank INTEGER;
BEGIN
    -- Check if top8 already exists for this season
    SELECT id INTO v_top8_id FROM top8s WHERE season_id = p_season_id;
    IF v_top8_id IS NOT NULL THEN
        RETURN v_top8_id;
    END IF;

    -- Get the best_legs_count for this season
    SELECT best_legs_count INTO v_best_legs_count 
    FROM seasons 
    WHERE id = p_season_id;

    -- Create the top8 record
    INSERT INTO top8s (season_id, status)
    VALUES (p_season_id, 'pending')
    RETURNING id INTO v_top8_id;

    -- Get the top 8 players and store them in an array
    WITH player_leg_scores AS (
        SELECT 
            p.id as player_id,
            p.name as player_name,
            lr.leg_id,
            lr.points,
            lr.participated,
            ROW_NUMBER() OVER (
                PARTITION BY p.id 
                ORDER BY CASE WHEN lr.participated THEN lr.points ELSE 0 END DESC
            ) as leg_rank
        FROM players p
        LEFT JOIN leg_results lr ON p.id = lr.player_id
        LEFT JOIN legs l ON lr.leg_id = l.id
        WHERE l.season_id = p_season_id
        AND l.status = 'completed'
        AND p.deleted_at IS NULL
    ),
    player_best_scores AS (
        SELECT 
            player_id,
            player_name,
            SUM(CASE WHEN leg_rank <= v_best_legs_count AND participated THEN points ELSE 0 END) as total_points,
            COUNT(CASE WHEN leg_rank <= v_best_legs_count AND participated THEN 1 END) as legs_count
        FROM player_leg_scores
        GROUP BY player_id, player_name
    ),
    ranked_players AS (
        SELECT 
            player_id,
            player_name,
            ROW_NUMBER() OVER (ORDER BY total_points DESC, legs_count DESC) as rank
        FROM player_best_scores
        WHERE total_points > 0
        ORDER BY rank
        LIMIT 8
    )
    SELECT array_agg(player_id ORDER BY rank) INTO v_top8_players
    FROM ranked_players;

    -- Create Quarter Finals with proper seeding (1v8, 2v7, 3v6, 4v5)
    INSERT INTO top8_matches (top8_id, player1_id, player2_id, round, ordinal) VALUES
        (v_top8_id, v_top8_players[1], v_top8_players[8], 'qf', 1),  -- 1st vs 8th
        (v_top8_id, v_top8_players[2], v_top8_players[7], 'qf', 2),  -- 2nd vs 7th
        (v_top8_id, v_top8_players[3], v_top8_players[6], 'qf', 3),  -- 3rd vs 6th
        (v_top8_id, v_top8_players[4], v_top8_players[5], 'qf', 4);  -- 4th vs 5th

    -- Create Semi Finals (4 matches)
    INSERT INTO top8_matches (top8_id, round, ordinal) VALUES
        (v_top8_id, 'sf', 1),
        (v_top8_id, 'sf', 2),
        (v_top8_id, 'sf', 3),
        (v_top8_id, 'sf', 4);

    -- Create Final (1 match)
    INSERT INTO top8_matches (top8_id, round, ordinal) VALUES
        (v_top8_id, 'final', 1);

    RAISE NOTICE 'Created Top 8 tournament with ID: %', v_top8_id;
    RAISE NOTICE 'Quarter Finals seeded as: 1v8, 2v7, 3v6, 4v5';
    RAISE NOTICE 'Created 4 Semi-Final matches and 1 Final match';

    RETURN v_top8_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_top8_for_season(UUID) TO authenticated; 