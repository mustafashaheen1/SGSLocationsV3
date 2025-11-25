-- Add notes field to properties table for admin use only
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS notes text DEFAULT '';

-- Add a comment explaining the notes field
COMMENT ON COLUMN properties.notes IS 'Internal notes for admin use only, auto-saves independently';
