-- Migration 006: Fix store_users table if missing
-- Run this in your Supabase SQL editor

-- Check if store_users table exists, if not create it
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'store_users') THEN
        -- Create store_users junction table for TO assignments
        CREATE TABLE store_users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
            role TEXT NOT NULL DEFAULT 'to',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, store_id)
        );

        -- Enable Row Level Security
        ALTER TABLE store_users ENABLE ROW LEVEL SECURITY;

        -- RLS Policies for store_users table
        CREATE POLICY "Admins can manage store users" ON store_users
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE users.id = auth.uid() 
                    AND users.role = 'admin'
                )
            );

        -- Create indexes for better performance
        CREATE INDEX idx_store_users_user_id ON store_users(user_id);
        CREATE INDEX idx_store_users_store_id ON store_users(store_id);
        
        RAISE NOTICE 'Created store_users table';
    ELSE
        RAISE NOTICE 'store_users table already exists';
    END IF;
END $$; 