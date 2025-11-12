/*
  # Create Search Filters and Tags System

  1. New Tables
    - `search_filters`
      - `id` (uuid, primary key)
      - `name` (text) - Display name of the filter category
      - `slug` (text, unique) - URL-friendly identifier
      - `display_order` (integer) - Sort order for display
      - `has_search` (boolean) - Whether to show search box for this filter
      - `is_active` (boolean) - Enable/disable filter
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `search_filter_tags`
      - `id` (uuid, primary key)
      - `filter_id` (uuid, foreign key) - References search_filters
      - `name` (text) - Tag display name
      - `slug` (text) - URL-friendly tag identifier
      - `display_order` (integer) - Sort order within filter
      - `is_active` (boolean) - Enable/disable tag
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Admin-only access for managing filters and tags
    - Public read access for active filters and tags

  3. Indexes
    - Index on filter slug for fast lookups
    - Index on tag filter_id for fast tag queries
    - Index on display_order for sorting
*/

-- Create search_filters table
CREATE TABLE IF NOT EXISTS search_filters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  display_order integer DEFAULT 0,
  has_search boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create search_filter_tags table
CREATE TABLE IF NOT EXISTS search_filter_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filter_id uuid NOT NULL REFERENCES search_filters(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(filter_id, slug)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_search_filters_slug ON search_filters(slug);
CREATE INDEX IF NOT EXISTS idx_search_filters_display_order ON search_filters(display_order);
CREATE INDEX IF NOT EXISTS idx_search_filter_tags_filter_id ON search_filter_tags(filter_id);
CREATE INDEX IF NOT EXISTS idx_search_filter_tags_display_order ON search_filter_tags(display_order);

-- Enable RLS
ALTER TABLE search_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_filter_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for search_filters

-- Public can view active filters
CREATE POLICY "Anyone can view active search filters"
  ON search_filters
  FOR SELECT
  TO public
  USING (is_active = true);

-- Admins can view all filters
CREATE POLICY "Admins can view all search filters"
  ON search_filters
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Admins can insert filters
CREATE POLICY "Admins can insert search filters"
  ON search_filters
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Admins can update filters
CREATE POLICY "Admins can update search filters"
  ON search_filters
  FOR UPDATE
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

-- Admins can delete filters
CREATE POLICY "Admins can delete search filters"
  ON search_filters
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- RLS Policies for search_filter_tags

-- Public can view active tags
CREATE POLICY "Anyone can view active filter tags"
  ON search_filter_tags
  FOR SELECT
  TO public
  USING (is_active = true);

-- Admins can view all tags
CREATE POLICY "Admins can view all filter tags"
  ON search_filter_tags
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Admins can insert tags
CREATE POLICY "Admins can insert filter tags"
  ON search_filter_tags
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Admins can update tags
CREATE POLICY "Admins can update filter tags"
  ON search_filter_tags
  FOR UPDATE
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

-- Admins can delete tags
CREATE POLICY "Admins can delete filter tags"
  ON search_filter_tags
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );
