-- Add sub_heading column to properties table
-- This allows admins to set custom sub-headings for property detail pages

-- Step 1: Add the column as nullable first
ALTER TABLE properties ADD COLUMN IF NOT EXISTS sub_heading TEXT;

-- Step 2: Auto-populate existing properties with the current default format
-- This ensures backward compatibility and all existing properties have meaningful sub-headings
UPDATE properties
SET sub_heading = name || ': An Architectural Marvel in ' || city || ' for Filmmakers and Photographers'
WHERE sub_heading IS NULL;

-- Step 3: Make the column required going forward
ALTER TABLE properties ALTER COLUMN sub_heading SET NOT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN properties.sub_heading IS
'Custom sub-heading displayed on property detail page. Required field for all properties.';
