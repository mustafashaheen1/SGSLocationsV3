-- Make property_id nullable in projects table
-- This allows portfolio projects to exist without being linked to a specific property

ALTER TABLE projects
ALTER COLUMN property_id DROP NOT NULL;

-- Update any existing NULL values (should be none, but just in case)
-- This is safe since we're making the column nullable
COMMENT ON COLUMN projects.property_id IS 'Optional foreign key to properties table. NULL if project is not linked to a specific property.';
