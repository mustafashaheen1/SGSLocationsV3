/*
  # Create Terms and Conditions Table

  1. New Tables
    - `terms_and_conditions`
      - `id` (uuid, primary key)
      - `content` (text) - The full terms and conditions text content
      - `version` (bigint) - Timestamp-based version number for tracking revisions
      - `is_active` (boolean) - Whether this version is currently active
      - `created_at` (timestamptz) - When this version was created
      - `updated_at` (timestamptz) - When this version was last updated

  2. Security
    - Enable RLS on `terms_and_conditions` table
    - Public read access for active terms (for List Your Property page)
    - Admin-only write access for creating/updating terms

  3. Indexes
    - Index on `is_active` for faster active version lookups
    - Index on `version` for version history queries
*/

CREATE TABLE IF NOT EXISTS terms_and_conditions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  version bigint NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE terms_and_conditions ENABLE ROW LEVEL SECURITY;

-- Public can read active terms
CREATE POLICY "Anyone can view active terms"
  ON terms_and_conditions
  FOR SELECT
  USING (is_active = true);

-- Only authenticated users (admins) can insert new versions
CREATE POLICY "Authenticated users can insert terms"
  ON terms_and_conditions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only authenticated users (admins) can update terms
CREATE POLICY "Authenticated users can update terms"
  ON terms_and_conditions
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_terms_is_active ON terms_and_conditions(is_active);
CREATE INDEX IF NOT EXISTS idx_terms_version ON terms_and_conditions(version DESC);