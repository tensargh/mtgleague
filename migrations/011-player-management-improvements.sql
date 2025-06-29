-- Migration 011: Player Management Improvements
-- Add soft delete functionality and improve player visibility handling

-- Add deleted_at column to players table for soft delete
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Add index for soft delete queries
CREATE INDEX IF NOT EXISTS idx_players_deleted_at ON players(deleted_at);

-- Update RLS policies to exclude soft-deleted players
DROP POLICY IF EXISTS "Public can view public players" ON players;
CREATE POLICY "Public can view public players" ON players
    FOR SELECT USING (
        visibility = 'public' 
        AND deleted_at IS NULL
    );

-- Update TO policy to exclude soft-deleted players
DROP POLICY IF EXISTS "TOs can manage their store players" ON players;
CREATE POLICY "TOs can manage their store players" ON players
    FOR ALL USING (
        deleted_at IS NULL
        AND EXISTS (
            SELECT 1 FROM store_tos 
            WHERE store_tos.store_id = players.store_id 
            AND store_tos.user_id = auth.uid()
        )
    );

-- Update admin policy to exclude soft-deleted players
DROP POLICY IF EXISTS "Admins can manage all players" ON players;
CREATE POLICY "Admins can manage all players" ON players
    FOR ALL USING (
        deleted_at IS NULL
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Create function to soft delete a player
CREATE OR REPLACE FUNCTION soft_delete_player(player_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE players 
    SET deleted_at = NOW()
    WHERE id = player_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to restore a soft-deleted player
CREATE OR REPLACE FUNCTION restore_player(player_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE players 
    SET deleted_at = NULL
    WHERE id = player_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION soft_delete_player(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION restore_player(UUID) TO authenticated;

-- Add comment explaining the soft delete functionality
COMMENT ON COLUMN players.deleted_at IS 'Timestamp when player was soft deleted. NULL means active player.';
COMMENT ON FUNCTION soft_delete_player(UUID) IS 'Soft delete a player by setting deleted_at timestamp';
COMMENT ON FUNCTION restore_player(UUID) IS 'Restore a soft-deleted player by clearing deleted_at timestamp'; 