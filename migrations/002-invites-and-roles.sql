-- Migration 002: Invites and Role Management System
-- Run this in your Supabase SQL editor

-- 1. Add cannot_be_deleted column to users table (if not already present)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS cannot_be_deleted BOOLEAN DEFAULT FALSE;

-- 2. Create invites table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS invites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'to')),
    token UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    accepted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE -- For TO invites
);

-- 3. Create index for faster lookups (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_invites_token ON invites(token);
CREATE INDEX IF NOT EXISTS idx_invites_email ON invites(email);
CREATE INDEX IF NOT EXISTS idx_invites_accepted ON invites(accepted);

-- 4. Create function to accept invite and create user
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
    new_user_id UUID;
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
    
    -- Create user in auth.users (this will be handled by Supabase Auth)
    -- We'll return the invite details for the frontend to handle auth creation
    result := json_build_object(
        'success', true,
        'invite_id', invite_record.id,
        'role', invite_record.role,
        'email', invite_record.email
    );
    
    RETURN result;
END;
$$;

-- 5. Create function to mark invite as accepted and create user record
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
    
    -- Create user record
    INSERT INTO users (id, email, role, created_at)
    VALUES (auth_user_id, invite_record.email, invite_record.role, NOW());
    
    -- If this is a TO invite, create the store association
    IF invite_record.role = 'tournament_organiser' AND invite_record.store_id IS NOT NULL THEN
        INSERT INTO store_tos (store_id, user_id, assigned_at)
        VALUES (invite_record.store_id, auth_user_id, NOW());
    END IF;
    
    RETURN TRUE;
END;
$$;

-- 6. Create function to promote/demote users
CREATE OR REPLACE FUNCTION change_user_role(
    target_user_id UUID,
    new_role TEXT,
    admin_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    target_user RECORD;
    admin_user RECORD;
BEGIN
    -- Check if admin user exists and is admin
    SELECT * INTO admin_user FROM users WHERE id = admin_user_id AND role = 'admin';
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Check if target user exists and can be modified
    SELECT * INTO target_user FROM users WHERE id = target_user_id;
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Check if target user cannot be deleted (protected admin)
    IF target_user.cannot_be_deleted = TRUE THEN
        RETURN FALSE;
    END IF;
    
    -- Update role
    UPDATE users SET role = new_role WHERE id = target_user_id;
    
    RETURN TRUE;
END;
$$;

-- 7. Create function to delete user
CREATE OR REPLACE FUNCTION delete_user(
    target_user_id UUID,
    admin_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    target_user RECORD;
    admin_user RECORD;
BEGIN
    -- Check if admin user exists and is admin
    SELECT * INTO admin_user FROM users WHERE id = admin_user_id AND role = 'admin';
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Check if target user exists and can be deleted
    SELECT * INTO target_user FROM users WHERE id = target_user_id;
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Check if target user cannot be deleted (protected admin)
    IF target_user.cannot_be_deleted = TRUE THEN
        RETURN FALSE;
    END IF;
    
    -- Delete user record (auth user deletion will be handled by frontend)
    DELETE FROM users WHERE id = target_user_id;
    
    RETURN TRUE;
END;
$$;

-- 8. Set up RLS policies for invites table
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- Admins can see all invites
CREATE POLICY "Admins can view all invites" ON invites
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Admins can create invites
CREATE POLICY "Admins can create invites" ON invites
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Admins can update invites
CREATE POLICY "Admins can update invites" ON invites
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Admins can delete invites (for revoking)
CREATE POLICY "Admins can delete invites" ON invites
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Anyone can read invites by token (for acceptance)
CREATE POLICY "Anyone can read invites by token" ON invites
    FOR SELECT USING (TRUE);

-- 9. Grant execute permissions
GRANT EXECUTE ON FUNCTION accept_invite_and_create_user(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_invite_acceptance(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION change_user_role(UUID, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user(UUID, UUID) TO authenticated; 