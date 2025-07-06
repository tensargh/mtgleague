-- Migration 046: Fix role constraints step by step
-- First update existing data, then add new constraints

-- Step 1: Update existing 'to' values to 'tournament_organiser' BEFORE adding new constraints
UPDATE invites SET role = 'tournament_organiser' WHERE role = 'to';
UPDATE users SET role = 'tournament_organiser' WHERE role = 'to';

-- Step 2: Now drop the old constraints
ALTER TABLE invites DROP CONSTRAINT IF EXISTS invites_role_check;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Step 3: Add the new constraints that allow 'admin' and 'tournament_organiser'
ALTER TABLE invites ADD CONSTRAINT invites_role_check CHECK (role IN ('admin', 'tournament_organiser'));
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'tournament_organiser')); 