-- Migration 014: Top 8 Tournament System
-- Add Top 8 tournament functionality to complete seasons

-- Create top8s table
CREATE TABLE IF NOT EXISTS top8s (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(season_id)
);

-- Create top8_matches table
CREATE TABLE IF NOT EXISTS top8_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    top8_id UUID NOT NULL REFERENCES top8s(id) ON DELETE CASCADE,
    player1_id UUID REFERENCES players(id) ON DELETE SET NULL,
    player2_id UUID REFERENCES players(id) ON DELETE SET NULL,
    round TEXT NOT NULL CHECK (round IN ('qf', 'sf', 'final')),
    result TEXT CHECK (result IN ('2-0', '2-1', '1-2', '0-2')),
    winner_id UUID REFERENCES players(id) ON DELETE SET NULL,
    ordinal INTEGER NOT NULL, -- Order within the round (1-4 for QF, 1-2 for SF, 1 for Final)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(top8_id, round, ordinal)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_top8s_season_id ON top8s(season_id);
CREATE INDEX IF NOT EXISTS idx_top8s_status ON top8s(status);
CREATE INDEX IF NOT EXISTS idx_top8_matches_top8_id ON top8_matches(top8_id);
CREATE INDEX IF NOT EXISTS idx_top8_matches_round ON top8_matches(round);
CREATE INDEX IF NOT EXISTS idx_top8_matches_player1_id ON top8_matches(player1_id);
CREATE INDEX IF NOT EXISTS idx_top8_matches_player2_id ON top8_matches(player2_id);

-- Enable RLS
ALTER TABLE top8s ENABLE ROW LEVEL SECURITY;
ALTER TABLE top8_matches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for top8s
-- Public can view completed top8s
CREATE POLICY "Public can view completed top8s" ON top8s
    FOR SELECT USING (status = 'completed');

-- TOs can manage top8s in their store seasons
CREATE POLICY "TOs can manage their store top8s" ON top8s
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM store_tos st
            JOIN seasons s ON s.store_id = st.store_id
            WHERE s.id = top8s.season_id 
            AND st.user_id = auth.uid()
        )
    );

-- Admins can manage all top8s
CREATE POLICY "Admins can manage all top8s" ON top8s
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- RLS Policies for top8_matches
-- Public can view completed top8 matches
CREATE POLICY "Public can view completed top8 matches" ON top8_matches
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM top8s 
            WHERE top8s.id = top8_matches.top8_id 
            AND top8s.status = 'completed'
        )
    );

-- TOs can manage matches in their store top8s
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

-- Admins can manage all top8 matches
CREATE POLICY "Admins can manage all top8 matches" ON top8_matches
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Function to create a new top8 for a season
CREATE OR REPLACE FUNCTION create_top8_for_season(p_season_id UUID)
RETURNS UUID AS $$
DECLARE
    v_top8_id UUID;
    v_standings RECORD;
    v_rank INTEGER := 1;
    v_qf_matches INTEGER[] := ARRAY[1, 2, 3, 4]; -- QF match ordinals
BEGIN
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

-- Add comments
COMMENT ON TABLE top8s IS 'Top 8 tournaments for completed seasons';
COMMENT ON TABLE top8_matches IS 'Individual matches within top 8 tournaments';
COMMENT ON FUNCTION create_top8_for_season(UUID) IS 'Creates a new top8 tournament with seeded quarter-finals';
COMMENT ON FUNCTION complete_top8(UUID) IS 'Completes a top8 tournament and marks the season as completed'; 