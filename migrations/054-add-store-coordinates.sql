-- Migration 054: Add store coordinates for store finder
-- Add latitude and longitude columns to stores table for map functionality

-- Add coordinate columns to stores table
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Add comments to document the columns
COMMENT ON COLUMN stores.latitude IS 'Store latitude coordinate for map display';
COMMENT ON COLUMN stores.longitude IS 'Store longitude coordinate for map display';

-- Create an index for efficient geospatial queries
CREATE INDEX IF NOT EXISTS idx_stores_coordinates ON stores(latitude, longitude);

-- Add a check constraint to ensure valid coordinate ranges
ALTER TABLE stores 
ADD CONSTRAINT check_latitude_range CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90)),
ADD CONSTRAINT check_longitude_range CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180)); 