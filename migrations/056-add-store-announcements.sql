-- Migration 056: Add Store Announcements System
-- Create a simple announcement system for stores

-- Create the store_announcements table
CREATE TABLE IF NOT EXISTS store_announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Add RLS policies
ALTER TABLE store_announcements ENABLE ROW LEVEL SECURITY;

-- TOs can view and manage announcements for their assigned stores
CREATE POLICY "TOs can view store announcements" ON store_announcements
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM store_tos 
            WHERE store_tos.store_id = store_announcements.store_id 
            AND store_tos.user_id = auth.uid()
        )
    );

-- TOs can insert announcements for their assigned stores
CREATE POLICY "TOs can insert store announcements" ON store_announcements
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM store_tos 
            WHERE store_tos.store_id = store_announcements.store_id 
            AND store_tos.user_id = auth.uid()
        )
    );

-- TOs can update announcements for their assigned stores
CREATE POLICY "TOs can update store announcements" ON store_announcements
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM store_tos 
            WHERE store_tos.store_id = store_announcements.store_id 
            AND store_tos.user_id = auth.uid()
        )
    );

-- TOs can delete announcements for their assigned stores
CREATE POLICY "TOs can delete store announcements" ON store_announcements
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM store_tos 
            WHERE store_tos.store_id = store_announcements.store_id 
            AND store_tos.user_id = auth.uid()
        )
    );

-- Public can view active announcements
CREATE POLICY "Public can view active store announcements" ON store_announcements
    FOR SELECT USING (is_active = true);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_store_announcements_store_id ON store_announcements(store_id);
CREATE INDEX IF NOT EXISTS idx_store_announcements_active ON store_announcements(is_active);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_store_announcements_updated_at 
    BEFORE UPDATE ON store_announcements 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON store_announcements TO authenticated;
GRANT SELECT ON store_announcements TO anon;

-- Add comments
COMMENT ON TABLE store_announcements IS 'Simple announcement system for stores with rich text content';
COMMENT ON COLUMN store_announcements.content IS 'Rich text content for announcements (HTML sanitized)';
COMMENT ON COLUMN store_announcements.is_active IS 'Whether the announcement is currently visible to the public'; 