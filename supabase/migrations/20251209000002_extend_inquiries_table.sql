-- Complete Inquiries Table Setup
-- This creates the inquiries table from scratch with all required fields
-- Run this ONCE in your Supabase Dashboard SQL Editor

-- Create inquiries table
CREATE TABLE IF NOT EXISTS inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  user_name text NOT NULL,
  user_email text NOT NULL,
  user_phone text,
  first_name text,
  last_name text,
  company text,
  message text NOT NULL,
  crew_size integer,
  locations text,
  shooting_date text,
  project_type text,
  how_did_you_hear text,
  status text DEFAULT 'new',
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  responded_at timestamptz
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_inquiries_property_id ON inquiries(property_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_user_id ON inquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_email ON inquiries(user_email);

-- Enable Row Level Security
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own inquiries
CREATE POLICY "Users can view their own inquiries"
  ON inquiries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policy: Property owners can view inquiries for their properties
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

-- RLS Policy: Admins can view all inquiries
CREATE POLICY "Admins can view all inquiries"
  ON inquiries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- RLS Policy: Authenticated users can create inquiries
CREATE POLICY "Authenticated users can create inquiries"
  ON inquiries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Property owners can update inquiry status for their properties
CREATE POLICY "Property owners can update inquiry status"
  ON inquiries FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = inquiries.property_id
      AND properties.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = inquiries.property_id
      AND properties.owner_id = auth.uid()
    )
  );

-- RLS Policy: Admins can update all inquiries
CREATE POLICY "Admins can update all inquiries"
  ON inquiries FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );
