-- Migration 015: Fix Top 8 Migration Conflicts
-- Handle cases where Top 8 tables/policies already exist

-- Drop existing policies if they exist (to recreate them properly)
DROP POLICY IF EXISTS "Public can view completed top8s" ON top8s;
DROP POLICY IF EXISTS "TOs can manage their store top8s" ON top8s;
DROP POLICY IF EXISTS "Admins can manage all top8s" ON top8s;
DROP POLICY IF EXISTS "Public can view completed top8 matches" ON top8_matches;
DROP POLICY IF EXISTS "TOs can manage their store top8 matches" ON top8_matches;
DROP POLICY IF EXISTS "Admins can manage all top8 matches" ON top8_matches;

-- Recreate policies with proper IF NOT EXISTS handling
CREATE POLICY "Public can view completed top8s" ON top8s
    FOR SELECT USING (status = 'completed');

CREATE POLICY "TOs can manage their store top8s" ON top8s
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM store_tos st
            JOIN seasons s ON s.store_id = st.store_id
            WHERE s.id = top8s.season_id 
            AND st.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all top8s" ON top8s
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Public can view completed top8 matches" ON top8_matches
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM top8s 
            WHERE top8s.id = top8_matches.top8_id 
            AND top8s.status = 'completed'
        )
    );

CREATE POLICY "TOs can manage their store top8 matches" ON top8_matches
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM store_tos st
            JOIN seasons s ON s.store_id = st.store_id
            JOIN top8s t ON t.season_id = s.id
            WHERE t.id = top8_matches.top8_id 
            AND st.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all top8 matches" ON top8_matches
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Recreate functions with proper error handling
CREATE OR REPLACE FUNCTION create_top8_for_season(p_season_id UUID)
RETURNS UUID AS $$
DECLARE
    v_top8_id UUID;
    v_standings RECORD;
    v_rank INTEGER := 1;
    v_qf_matches INTEGER[] := ARRAY[1, 2, 3, 4]; -- QF match ordinals
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

    -- Get season standings (top 8 players)
    FOR v_standings IN (
        SELECT 
            p.id as player_id,
            p.name as player_name,
            ROW_NUMBER() OVER (ORDER BY 
                COALESCE(SUM(CASE WHEN lr.participated THEN lr.points ELSE 0 END), 0) DESC,
                COALESCE(SUM(CASE WHEN lr.participated THEN lr.wins ELSE 0 END), 0) DESC,
                COALESCE(SUM(CASE WHEN lr.participated THEN lr.draws ELSE 0 END), 0) DESC
            ) as rank
        FROM players p
        LEFT JOIN leg_results lr ON p.id = lr.player_id
        LEFT JOIN legs l ON lr.leg_id = l.id
        WHERE l.season_id = p_season_id
        AND p.deleted_at IS NULL
        GROUP BY p.id, p.name
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
                -- Get the opponent player ID
                SELECT p.id INTO v_opponent_id
                FROM players p
                LEFT JOIN leg_results lr ON p.id = lr.player_id
                LEFT JOIN legs l ON lr.leg_id = l.id
                WHERE l.season_id = p_season_id
                AND p.deleted_at IS NULL
                GROUP BY p.id, p.name
                ORDER BY 
                    COALESCE(SUM(CASE WHEN lr.participated THEN lr.points ELSE 0 END), 0) DESC,
                    COALESCE(SUM(CASE WHEN lr.participated THEN lr.wins ELSE 0 END), 0) DESC,
                    COALESCE(SUM(CASE WHEN lr.participated THEN lr.draws ELSE 0 END), 0) DESC
                LIMIT 1 OFFSET (v_opponent_rank - 1);

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

-- Function to complete a top8 and mark season as completed
CREATE OR REPLACE FUNCTION complete_top8(p_top8_id UUID)
RETURNS VOID AS $$
DECLARE
    v_season_id UUID;
    v_unfinished_matches INTEGER;
BEGIN
    -- Get the season ID
    SELECT season_id INTO v_season_id FROM top8s WHERE id = p_top8_id;
    
    -- Check if all matches have results
    SELECT COUNT(*) INTO v_unfinished_matches
    FROM top8_matches 
    WHERE top8_id = p_top8_id 
    AND result IS NULL;
    
    IF v_unfinished_matches > 0 THEN
        RAISE EXCEPTION 'Cannot complete top8: % matches still need results', v_unfinished_matches;
    END IF;
    
    -- Update top8 status to completed
    UPDATE top8s 
    SET status = 'completed', completed_at = NOW()
    WHERE id = p_top8_id;
    
    -- Mark season as completed
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_top8_for_season(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_top8(UUID) TO authenticated; 