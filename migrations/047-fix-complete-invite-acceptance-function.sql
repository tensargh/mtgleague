-- Migration 047: Fix complete_invite_acceptance function
-- Fix the role casting issue in the complete_invite_acceptance function

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
BEGIN
    -- Get invite details
    SELECT * INTO invite_record 
    FROM invites 
    WHERE id = invite_id 
    AND accepted = FALSE;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Mark invite as accepted
    UPDATE invites SET accepted = TRUE WHERE id = invite_id;
    
    -- Create user record with proper role casting
    INSERT INTO users (id, email, role, created_at)
    VALUES (auth_user_id, invite_record.email, invite_record.role::user_role, NOW());
    
    -- If this is a TO invite, create the store association
    IF invite_record.role = 'tournament_organiser' AND invite_record.store_id IS NOT NULL THEN
        INSERT INTO store_tos (store_id, user_id, assigned_at)
        VALUES (invite_record.store_id, auth_user_id, NOW());
    END IF;
    
    RETURN TRUE;
END;
$$; 