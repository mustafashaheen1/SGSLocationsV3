/*
  # Create Saved Searches Table

  1. New Table
    - `saved_searches`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `search_text` (text, the search query entered by user)
      - `filters` (jsonb, stores filter selections like categories, property types, etc.)
      - `tags` (text[], array of selected tag names/slugs)
      - `result_count` (integer, number of properties found)
      - `last_checked_at` (timestamptz, when we last checked the result count)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `saved_searches` table
    - Users can only access their own saved searches
    - Authenticated users can create, read, update, and delete their own searches

  3. Indexes
    - Index on user_id for efficient lookups
    - Index on created_at for sorting
*/

-- Create saved_searches table
CREATE TABLE IF NOT EXISTS saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  search_text text DEFAULT '',
  filters jsonb DEFAULT '{}',
  tags text[] DEFAULT '{}',
  result_count integer DEFAULT 0,
  last_checked_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_created_at ON saved_searches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_searches_last_checked ON saved_searches(last_checked_at DESC);

-- Enable RLS
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own saved searches
CREATE POLICY "Users can view their own saved searches"
  ON saved_searches
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own saved searches
CREATE POLICY "Users can create their own saved searches"
  ON saved_searches
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own saved searches
CREATE POLICY "Users can update their own saved searches"
  ON saved_searches
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own saved searches
CREATE POLICY "Users can delete their own saved searches"
  ON saved_searches
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add comment to table
COMMENT ON TABLE saved_searches IS 'Stores user search history with filters and tags for quick access';

-- Add comments to columns
COMMENT ON COLUMN saved_searches.search_text IS 'The text entered in the search field';
COMMENT ON COLUMN saved_searches.filters IS 'JSON object containing filter selections (categories, property types, etc.)';
COMMENT ON COLUMN saved_searches.tags IS 'Array of selected tag names or slugs';
COMMENT ON COLUMN saved_searches.result_count IS 'Number of properties found in the search';
COMMENT ON COLUMN saved_searches.last_checked_at IS 'Timestamp of when we last checked the result count';
