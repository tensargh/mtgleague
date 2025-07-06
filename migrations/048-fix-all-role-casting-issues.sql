-- Migration 048: Fix all role casting issues
-- Comprehensive fix for all functions that handle role casting

-- First, let's check what functions exist and drop/recreate them properly
DROP FUNCTION IF EXISTS complete_invite_acceptance(UUID, UUID);

-- Recreate the complete_invite_acceptance function with proper role casting
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
        RAISE EXCEPTION 'Invite not found or already accepted';
    END IF;
    
    -- Mark invite as accepted
    UPDATE invites SET accepted = TRUE WHERE id = invite_id;
    
    -- Create user record with explicit role casting
    INSERT INTO users (id, email, role, created_at)
    VALUES (
        auth_user_id, 
        invite_record.email, 
        CASE 
            WHEN invite_record.role = 'admin' THEN 'admin'::user_role
            WHEN invite_record.role = 'tournament_organiser' THEN 'tournament_organiser'::user_role
            ELSE 'tournament_organiser'::user_role
        END, 
        NOW()
    );
    
    -- If this is a TO invite, create the store association
    IF invite_record.role = 'tournament_organiser' AND invite_record.store_id IS NOT NULL THEN
        INSERT INTO store_tos (store_id, user_id, assigned_at)
        VALUES (invite_record.store_id, auth_user_id, NOW());
    END IF;
    
    RETURN TRUE;
END;
$$;

-- Also fix the accept_invite_and_create_user function if it exists
DROP FUNCTION IF EXISTS accept_invite_and_create_user(UUID, TEXT, TEXT);

CREATE OR REPLACE FUNCTION accept_invite_and_create_user(
    invite_token UUID,
    user_password TEXT,
    user_email TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    invite_record RECORD;
    result JSON;
BEGIN
    -- Get invite details
    SELECT * INTO invite_record 
    FROM invites 
    WHERE token = invite_token 
    AND accepted = FALSE 
    AND expires_at > NOW();
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Invalid or expired invite');
    END IF;
    
    IF invite_record.email != user_email THEN
        RETURN json_build_object('success', false, 'error', 'Email does not match invite');
    END IF;
    
    -- Return the invite details for the frontend to handle auth creation
    result := json_build_object(
        'success', true,
        'invite_id', invite_record.id,
        'role', invite_record.role,
        'email', invite_record.email
    );
    
    RETURN result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION complete_invite_acceptance(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION accept_invite_and_create_user(UUID, TEXT, TEXT) TO authenticated; 