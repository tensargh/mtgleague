-- Migration 003: Fix Invite Revoke Function
-- Run this in your Supabase SQL editor

-- Create function to revoke invite with proper admin checks
CREATE OR REPLACE FUNCTION revoke_invite(
    invite_id UUID,
    admin_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    admin_user RECORD;
    invite_record RECORD;
BEGIN
    -- Check if admin user exists and is admin
    SELECT * INTO admin_user FROM users WHERE id = admin_user_id AND role = 'admin';
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User is not an admin';
    END IF;
    
    -- Check if invite exists
    SELECT * INTO invite_record FROM invites WHERE id = invite_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invite not found';
    END IF;
    
    -- Delete the invite
    DELETE FROM invites WHERE id = invite_id;
    
    RETURN TRUE;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION revoke_invite(UUID, UUID) TO authenticated; 