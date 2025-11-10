/*
  # Content Management System Tables

  1. New Tables
    - `site_content` - Stores editable website content (homepage, about, contact)
    - `inquiries` - Property inquiries from users
    - `saved_searches` - User saved search filters
    - `saved_properties` - User saved properties/favorites

  2. Changes
    - Add `is_admin` column to users table

  3. Security
    - Enable RLS on all new tables
    - Add policies for appropriate access control
    - Admins can manage site content
    - Users can only access their own data
*/

-- Create site_content table
CREATE TABLE IF NOT EXISTS site_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page text NOT NULL,
  section text NOT NULL,
  content_key text NOT NULL,
  content_value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES users(id),
  UNIQUE(page, section, content_key)
);

-- Create inquiries table
CREATE TABLE IF NOT EXISTS inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  user_email text NOT NULL,
  user_phone text,
  message text NOT NULL,
  status text DEFAULT 'pending',
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  responded_at timestamptz
);

-- Create saved_searches table
CREATE TABLE IF NOT EXISTS saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  search_name text NOT NULL,
  filters jsonb NOT NULL,
  email_alerts boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create saved_properties table
CREATE TABLE IF NOT EXISTS saved_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  collection_name text,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, property_id)
);

-- Add admin role tracking to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- Enable RLS on new tables
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_properties ENABLE ROW LEVEL SECURITY;

-- Policies for site_content
CREATE POLICY "Anyone can view site content"
  ON site_content FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage site content"
  ON site_content FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = true));

-- Policies for inquiries
CREATE POLICY "Users can view their own inquiries"
  ON inquiries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Property owners can view inquiries for their properties"
  ON inquiries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = inquiries.property_id
      AND properties.owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all inquiries"
  ON inquiries FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = true));

CREATE POLICY "Users can create inquiries"
  ON inquiries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update inquiries"
  ON inquiries FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = true));

-- Policies for saved searches
CREATE POLICY "Users can manage their saved searches"
  ON saved_searches FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for saved properties
CREATE POLICY "Users can manage their saved properties"
  ON saved_properties FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_site_content_page ON site_content(page);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_property ON inquiries(property_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_user ON inquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_user ON saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_properties_user ON saved_properties(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_properties_property ON saved_properties(property_id);
