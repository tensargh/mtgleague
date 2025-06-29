-- Migration 005: Seasons Table
-- Run this in your Supabase SQL editor

-- Create seasons table
CREATE TABLE IF NOT EXISTS seasons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    total_legs INTEGER NOT NULL DEFAULT 10,
    best_legs_count INTEGER NOT NULL DEFAULT 7,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_seasons_store_id ON seasons(store_id);
CREATE INDEX IF NOT EXISTS idx_seasons_status ON seasons(status);
CREATE INDEX IF NOT EXISTS idx_seasons_created_at ON seasons(created_at);

-- Add RLS policies for seasons table
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;

-- Admins can view all seasons
CREATE POLICY "Admins can view all seasons" ON seasons
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Admins can create seasons for any store
CREATE POLICY "Admins can create seasons" ON seasons
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Admins can update any season
CREATE POLICY "Admins can update seasons" ON seasons
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- TOs can view seasons for their assigned store
CREATE POLICY "TOs can view seasons for their store" ON seasons
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM store_users 
            WHERE store_users.user_id = auth.uid() 
            AND store_users.store_id = seasons.store_id
            AND store_users.role = 'to'
        )
    );

-- TOs can create seasons for their assigned store
CREATE POLICY "TOs can create seasons for their store" ON seasons
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM store_users 
            WHERE store_users.user_id = auth.uid() 
            AND store_users.store_id = seasons.store_id
            AND store_users.role = 'to'
        )
    );

-- TOs can update seasons for their assigned store
CREATE POLICY "TOs can update seasons for their store" ON seasons
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM store_users 
            WHERE store_users.user_id = auth.uid() 
            AND store_users.store_id = seasons.store_id
            AND store_users.role = 'to'
        )
    );

-- Anyone can read seasons (for public viewing)
CREATE POLICY "Anyone can read seasons" ON seasons
    FOR SELECT USING (TRUE);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_seasons_updated_at 
    BEFORE UPDATE ON seasons 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 