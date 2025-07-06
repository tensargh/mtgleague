-- Migration 044: Fix invites table role constraint
-- Update the role constraint to allow 'tournament_organiser' instead of 'to'

-- Drop the existing constraint
ALTER TABLE invites DROP CONSTRAINT IF EXISTS invites_role_check;

-- Add the new constraint that allows both 'admin' and 'tournament_organiser'
ALTER TABLE invites ADD CONSTRAINT invites_role_check CHECK (role IN ('admin', 'tournament_organiser'));

-- Update any existing 'to' values to 'tournament_organiser' for consistency
UPDATE invites SET role = 'tournament_organiser' WHERE role = 'to';

-- Also update the users table if it has the same constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;ADD
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'tournament_organiser'));

-- Update any existing 'to' values in users table
UPDATE users SET role = 'tournament_organiser' WHERE role = 'to'; 