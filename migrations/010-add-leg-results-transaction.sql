-- Migration 010: Add transaction-based leg results saving (OPTIMIZED)
-- Run this in your Supabase SQL editor

-- Drop the function if it exists (to replace it)
DROP FUNCTION IF EXISTS save_leg_results_transaction(UUID, JSONB);

-- Create a simplified and optimized function to save leg results in a single transaction
CREATE OR REPLACE FUNCTION save_leg_results_transaction(
    p_leg_id UUID,
    p_results JSONB
) RETURNS JSONB AS $$
DECLARE
    store_id UUID;
    new_players JSONB := '[]'::JSONB;
    player_data JSONB;
    new_player_id UUID;
    temp_id TEXT;
    real_id UUID;
    updated_results JSONB := p_results;
BEGIN
    -- Get the store_id for this leg (do this once)
    SELECT s.store_id INTO store_id
    FROM legs l
    JOIN seasons s ON l.season_id = s.id
    WHERE l.id = p_leg_id;
    
    IF store_id IS NULL THEN
        RAISE EXCEPTION 'Leg not found or invalid';
    END IF;
    
    -- Create new players first (batch operation)
    FOR player_data IN SELECT * FROM jsonb_array_elements(p_results)
    LOOP
        IF (player_data->>'is_new_player')::BOOLEAN = true THEN
            -- Insert new player
            INSERT INTO players (store_id, name, visibility)
            VALUES (store_id, player_data->>'player_name', 'public')
            RETURNING id INTO new_player_id;
            
            -- Store the mapping for later use
            new_players := new_players || jsonb_build_object(
                'temp_id', player_data->>'player_id',
                'real_id', new_player_id
            );
        END IF;
    END LOOP;
    
    -- Delete existing results for this leg
    DELETE FROM leg_results WHERE leg_id = p_leg_id;
    
    -- Insert all results with proper player ID mapping
    INSERT INTO leg_results (leg_id, player_id, wins, draws, losses, points, participated)
    SELECT 
        p_leg_id,
        CASE 
            WHEN (r->>'is_new_player')::BOOLEAN = true THEN
                -- Find the real ID from our new_players mapping
                (SELECT (mapping->>'real_id')::UUID 
                 FROM jsonb_array_elements(new_players) AS mapping 
                 WHERE mapping->>'temp_id' = r->>'player_id')
            ELSE
                (r->>'player_id')::UUID
        END,
        (r->>'wins')::INTEGER,
        (r->>'draws')::INTEGER,
        (r->>'losses')::INTEGER,
        (r->>'points')::INTEGER,
        (r->>'participated')::BOOLEAN
    FROM jsonb_array_elements(p_results) AS r;
    
    -- Update leg status to completed
    UPDATE legs 
    SET 
        status = 'completed',
        completed_at = NOW()
    WHERE id = p_leg_id;
    
    -- Return success
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Leg results saved successfully',
        'players_created', jsonb_array_length(new_players),
        'results_saved', jsonb_array_length(p_results)
    );
    
EXCEPTION
    WHEN OTHERS THEN
        -- Rollback transaction automatically
        RAISE EXCEPTION 'Transaction failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION save_leg_results_transaction(UUID, JSONB) TO authenticated;

-- Add comment
COMMENT ON FUNCTION save_leg_results_transaction(UUID, JSONB) IS 'Optimized function to save leg results in a single transaction, handling new player creation efficiently'; 