-- Migration 004: Add store_id column to invites table
-- Run this in your Supabase SQL editor

-- Add store_id column to invites table if it doesn't exist
ALTER TABLE invites 
ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE CASCADE;

-- Add comment to explain the column
COMMENT ON COLUMN invites.store_id IS 'Store ID for TO invites (optional for admin invites)'; 