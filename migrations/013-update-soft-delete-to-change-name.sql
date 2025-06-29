-- Migration 013: Update Soft Delete to Change Player Name
-- Modify soft delete to change player name to "Deleted Player" and remove private data

-- Drop the existing soft delete function
DROP FUNCTION IF EXISTS soft_delete_player(UUID);

-- Create updated function that changes the player name to "Deleted Player"
CREATE OR REPLACE FUNCTION soft_delete_player(player_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE players 
    SET 
        deleted_at = NOW(),
        name = 'Deleted Player',
        visibility = 'public'  -- Make deleted players public so they show in all views
    WHERE id = player_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the restore function to handle the name change
DROP FUNCTION IF EXISTS restore_player(UUID);

-- Note: Restore function will need a new name parameter since we can't restore the original name
CREATE OR REPLACE FUNCTION restore_player(player_id UUID, new_name TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE players 
    SET 
        deleted_at = NULL,
        name = new_name,
        visibility = 'public'  -- Default to public when restored
    WHERE id = player_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies to allow deleted players to be visible
-- Since deleted players have generic names and public visibility, they can be shown everywhere
DROP POLICY IF EXISTS "Public can view all non-deleted players" ON players;
CREATE POLICY "Public can view all players" ON players
    FOR SELECT USING (true);

-- Update TO policy to allow management of all players (including deleted ones)
DROP POLICY IF EXISTS "TOs can manage their store players" ON players;
CREATE POLICY "TOs can manage their store players" ON players
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM store_tos 
            WHERE store_tos.store_id = players.store_id 
            AND store_tos.user_id = auth.uid()
        )
    );

-- Update admin policy to allow management of all players (including deleted ones)
DROP POLICY IF EXISTS "Admins can manage all players" ON players;
CREATE POLICY "Admins can manage all players" ON players
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION soft_delete_player(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION restore_player(UUID, TEXT) TO authenticated;

-- Add comments explaining the updated functionality
COMMENT ON FUNCTION soft_delete_player(UUID) IS 'Soft delete a player by setting deleted_at timestamp and changing name to "Deleted Player"';
COMMENT ON FUNCTION restore_player(UUID, TEXT) IS 'Restore a soft-deleted player by clearing deleted_at timestamp and setting a new name';
COMMENT ON POLICY "Public can view all players" ON players IS 'Allows viewing all players including deleted ones (deleted players have generic names)'; 