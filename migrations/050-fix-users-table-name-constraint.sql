-- Migration 050: Fix users table name constraint
-- Make the name column nullable since we don't have it during invite acceptance

-- First, let's check if the name column exists and make it nullable
ALTER TABLE users ALTER COLUMN name DROP NOT NULL;

-- Update the complete_invite_acceptance function to handle the name column properly
DROP FUNCTION IF EXISTS complete_invite_acceptance(UUID, UUID);

CREATE OR REPLACE FUNCTION complete_invite_acceptance(
    invite_id UUID,
    auth_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    invite_record RECORD;
    role_value user_role;
BEGIN
    -- Get invite details
    SELECT * INTO invite_record 
    FROM invites 
    WHERE id = invite_id 
    AND accepted = FALSE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invite not found or already accepted';
    END IF;
    
    -- Mark invite as accepted
    UPDATE invites SET accepted = TRUE WHERE id = invite_id;
    
    -- Explicitly cast the role to the correct type
    role_value := CASE 
        WHEN invite_record.role = 'admin' THEN 'admin'::user_role
        WHEN invite_record.role = 'tournament_organiser' THEN 'tournament_organiser'::user_role
        WHEN invite_record.role = 'to' THEN 'tournament_organiser'::user_role
        ELSE 'tournament_organiser'::user_role
    END;
    
    -- Create user record with the properly cast role and no name (will be set later)
    INSERT INTO users (id, email, role, created_at)
    VALUES (auth_user_id, invite_record.email, role_value, NOW());
    
    -- If this is a TO invite, create the store association
    IF invite_record.role IN ('tournament_organiser', 'to') AND invite_record.store_id IS NOT NULL THEN
        INSERT INTO store_tos (store_id, user_id, assigned_at)
        VALUES (invite_record.store_id, auth_user_id, NOW());
    END IF;
    
    RETURN TRUE;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION complete_invite_acceptance(UUID, UUID) TO authenticated; 