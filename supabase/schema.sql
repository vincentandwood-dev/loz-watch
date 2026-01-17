-- Locations table schema for loz.watch
-- Run this SQL in your Supabase SQL editor to create the table

CREATE TABLE IF NOT EXISTS locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('restaurant', 'marina', 'bar')),
  lat NUMERIC(10, 7) NOT NULL,
  lng NUMERIC(10, 7) NOT NULL,
  cam_embed_url TEXT,
  is_open BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create index on location type for faster filtering
CREATE INDEX IF NOT EXISTS idx_locations_type ON locations(type);

-- Create index on coordinates for geospatial queries (future use)
CREATE INDEX IF NOT EXISTS idx_locations_coords ON locations(lat, lng);

-- Enable Row Level Security (RLS)
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access (SELECT only, no writes)
CREATE POLICY "Allow public read access" ON locations
  FOR SELECT
  USING (true);

-- Explicitly deny INSERT, UPDATE, DELETE for anon users (RLS default)
-- No additional policies needed - RLS blocks all operations by default
-- Only the SELECT policy above allows reads

-- Insert mock data matching the original mock locations
-- These are clearly marked as mock data for initial setup
INSERT INTO locations (name, type, lat, lng, cam_embed_url, is_open) VALUES
  ('Shady Gators Bar & Grill', 'bar', 38.1350, -92.7850, 'https://www.youtube.com/embed/dQw4w9WgXcQ', true),
  ('Backwater Jack''s', 'restaurant', 38.1100, -92.7600, 'https://www.youtube.com/embed/dQw4w9WgXcQ', true),
  ('Marina Bay Resort', 'marina', 38.1250, -92.7750, NULL, true),
  ('Coconuts Caribbean Beach Bar', 'bar', 38.1050, -92.7700, 'https://www.youtube.com/embed/dQw4w9WgXcQ', false),
  ('H. Toad''s Bar & Grill', 'restaurant', 38.1300, -92.7800, NULL, true)
ON CONFLICT DO NOTHING;

