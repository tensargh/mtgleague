-- Migration 049: Force role casting fix
-- This migration specifically targets the role casting issue in complete_invite_acceptance

-- Drop the function completely to ensure we get a clean slate
DROP FUNCTION IF EXISTS complete_invite_acceptance(UUID, UUID);

-- Recreate with explicit role casting
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
    
    -- Create user record with the properly cast role
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