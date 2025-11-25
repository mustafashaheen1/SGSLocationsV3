-- Add contacts field to properties table
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS contacts jsonb DEFAULT '[]'::jsonb;

-- Add a comment explaining the contacts structure
COMMENT ON COLUMN properties.contacts IS 'Array of contact objects with fields: name, cell_number, home_number, office_number, email';
