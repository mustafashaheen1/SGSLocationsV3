-- Create favorite_properties table for users to save their favorite properties
CREATE TABLE IF NOT EXISTS favorite_properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, property_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_favorite_properties_user_id ON favorite_properties(user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_properties_property_id ON favorite_properties(property_id);
CREATE INDEX IF NOT EXISTS idx_favorite_properties_created_at ON favorite_properties(created_at DESC);

-- Enable RLS
ALTER TABLE favorite_properties ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own favorites
CREATE POLICY "Users can view their own favorites"
  ON favorite_properties FOR SELECT
  USING (auth.uid() = user_id);

-- Users can add to their favorites
CREATE POLICY "Users can add to favorites"
  ON favorite_properties FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can remove from their favorites
CREATE POLICY "Users can remove from favorites"
  ON favorite_properties FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can view all favorites
CREATE POLICY "Admins can view all favorites"
  ON favorite_properties FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.email = auth.email()
    )
  );
