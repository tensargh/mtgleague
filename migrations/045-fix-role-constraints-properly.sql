-- Migration 045: Fix role constraints properly
-- Fix the syntax error from migration 044 and ensure constraints are correct

-- Fix the invites table constraint
ALTER TABLE invites DROP CONSTRAINT IF EXISTS invites_role_check;
ALTER TABLE invites ADD CONSTRAINT invites_role_check CHECK (role IN ('admin', 'tournament_organiser'));

-- Fix the users table constraint (fix the syntax error from migration 044)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'tournament_organiser'));

-- Update any existing 'to' values to 'tournament_organiser' for consistency
UPDATE invites SET role = 'tournament_organiser' WHERE role = 'to';
UPDATE users SET role = 'tournament_organiser' WHERE role = 'to'; 