-- Add public_url column to properties table
-- Stores only the relative path like /property/{id}

-- Step 1: Add the column as nullable
ALTER TABLE properties ADD COLUMN IF NOT EXISTS public_url TEXT;

-- Step 2: Auto-populate for all existing properties
-- Use the property ID to construct the relative path
UPDATE properties
SET public_url = '/property/' || id::text
WHERE public_url IS NULL;

-- Step 3: Make the column NOT NULL going forward
ALTER TABLE properties ALTER COLUMN public_url SET NOT NULL;

-- Step 4: Add index for potential lookups by public URL
CREATE INDEX IF NOT EXISTS idx_properties_public_url ON properties(public_url);

-- Add comment to explain the column
COMMENT ON COLUMN properties.public_url IS
'Relative public URL path (e.g., /property/{id}). Stored without domain for flexibility when changing base URL.';

-- Step 5: Create a trigger to auto-set public_url for new properties
CREATE OR REPLACE FUNCTION set_property_public_url()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set if public_url is NULL (shouldn't happen, but defensive programming)
  IF NEW.public_url IS NULL THEN
    NEW.public_url := '/property/' || NEW.id::text;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that runs before insert
CREATE TRIGGER trigger_set_property_public_url
  BEFORE INSERT ON properties
  FOR EACH ROW
  EXECUTE FUNCTION set_property_public_url();
