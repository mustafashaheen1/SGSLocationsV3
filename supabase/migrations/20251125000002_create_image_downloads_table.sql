-- Create table to track image downloads
CREATE TABLE IF NOT EXISTS image_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  downloaded_at timestamptz DEFAULT now()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_image_downloads_property_id ON image_downloads(property_id);
CREATE INDEX IF NOT EXISTS idx_image_downloads_downloaded_at ON image_downloads(downloaded_at);

-- Enable RLS
ALTER TABLE image_downloads ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert downloads (for tracking)
CREATE POLICY "Anyone can track image downloads"
  ON image_downloads FOR INSERT
  TO public
  WITH CHECK (true);

-- Only admins can view download stats
CREATE POLICY "Admins can view download stats"
  ON image_downloads FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid()));

COMMENT ON TABLE image_downloads IS 'Tracks image downloads for analytics purposes';
