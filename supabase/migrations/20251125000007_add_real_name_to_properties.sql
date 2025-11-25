-- Add real_name column to properties table
-- real_name will store the actual property name (admin only)
-- name will store the obfuscated/generated name (public facing)

ALTER TABLE properties
ADD COLUMN IF NOT EXISTS real_name text;

COMMENT ON COLUMN properties.real_name IS 'The actual property name, only visible to admins. The "name" column will contain the obfuscated public name.';

-- Make real_name required for new entries (after migration)
-- We'll update existing data first, then add the constraint
