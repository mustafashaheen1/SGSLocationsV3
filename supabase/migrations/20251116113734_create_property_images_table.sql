/*
  # Create Property Images Table with Tagging

  1. New Tables
    - `property_images`
      - `id` (uuid, primary key)
      - `property_id` (uuid, foreign key to properties)
      - `image_url` (text, the S3/SmugMug URL)
      - `display_order` (integer, for ordering images)
      - `tags` (text[], array of tag names from search filters)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `property_images` table
    - Add policies for authenticated users to manage images
    - Allow public read access to view images
  
  3. Indexes
    - Index on property_id for efficient lookups
    - Index on tags for tag-based searches
*/

-- Create property_images table
CREATE TABLE IF NOT EXISTS property_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_property_images_property_id ON property_images(property_id);
CREATE INDEX IF NOT EXISTS idx_property_images_tags ON property_images USING gin(tags);

-- Enable RLS
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;

-- Public can view all property images
CREATE POLICY "Public can view property images"
  ON property_images
  FOR SELECT
  TO public
  USING (true);

-- Authenticated users can insert property images
CREATE POLICY "Authenticated users can insert property images"
  ON property_images
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can update property images
CREATE POLICY "Authenticated users can update property images"
  ON property_images
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Authenticated users can delete property images
CREATE POLICY "Authenticated users can delete property images"
  ON property_images
  FOR DELETE
  TO authenticated
  USING (true);
