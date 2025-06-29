-- Migration 016: Update Top 8 Standings Calculation
-- Update the create_top8_for_season function to use "best N results" calculation

-- Drop and recreate the function with proper standings calculation
CREATE OR REPLACE FUNCTION create_top8_for_season(p_season_id UUID)
RETURNS UUID AS $$
DECLARE
    v_top8_id UUID;
    v_standings RECORD;
    v_rank INTEGER := 1;
    v_best_legs_count INTEGER;
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

    -- Get season standings using "best N results" calculation
    FOR v_standings IN (
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
        )
        SELECT 
            player_id,
            player_name,
            ROW_NUMBER() OVER (ORDER BY total_points DESC, legs_count DESC) as rank
        FROM player_best_scores
        WHERE total_points > 0
        ORDER BY rank
        LIMIT 8
    ) LOOP
        -- Create QF matches with standard seeding (1v8, 2v7, 3v6, 4v5)
        IF v_rank <= 4 THEN
            -- First player in match (1,2,3,4)
            INSERT INTO top8_matches (top8_id, player1_id, round, ordinal)
            VALUES (v_top8_id, v_standings.player_id, 'qf', v_rank);
        ELSE
            -- Second player in match (8,7,6,5) - need to find the opponent
            DECLARE
                v_opponent_rank INTEGER := 9 - v_rank; -- 8->1, 7->2, 6->3, 5->4
                v_opponent_id UUID;
            BEGIN
                -- Get the opponent player ID using the same standings calculation
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
                SELECT player_id INTO v_opponent_id
                FROM ranked_players
                WHERE rank = v_opponent_rank;

                -- Update the QF match with the second player
                UPDATE top8_matches 
                SET player2_id = v_standings.player_id
                WHERE top8_id = v_top8_id 
                AND round = 'qf' 
                AND ordinal = v_opponent_rank;
            END;
        END IF;
        
        v_rank := v_rank + 1;
    END LOOP;

    RETURN v_top8_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 