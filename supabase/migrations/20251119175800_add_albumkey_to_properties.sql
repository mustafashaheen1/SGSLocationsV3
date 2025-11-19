/*
  # Add SmugMug AlbumKey to Properties

  1. Changes
    - Add `albumkey` column (text) to properties table
    - Add unique index on `albumkey` to prevent duplicate imports

  2. Purpose
    - Store SmugMug album identifier for each property
    - Enable duplicate detection during SmugMug imports
    - Prevent re-importing the same album multiple times
    - Allow relationship tracking between SmugMug albums and properties

  3. Notes
    - AlbumKey is SmugMug's unique identifier for albums
    - Unique constraint ensures one property per SmugMug album
    - NULL values allowed for properties not imported from SmugMug
    - Existing properties will have NULL albumkey (manually added properties)
*/

-- Add albumkey column to properties table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'albumkey'
  ) THEN
    ALTER TABLE properties ADD COLUMN albumkey text;
  END IF;
END $$;

-- Create unique index to prevent duplicate imports
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'properties' AND indexname = 'properties_albumkey_unique_idx'
  ) THEN
    CREATE UNIQUE INDEX properties_albumkey_unique_idx ON properties(albumkey) WHERE albumkey IS NOT NULL;
  END IF;
END $$;

-- Add comment to column
COMMENT ON COLUMN properties.albumkey IS 'SmugMug AlbumKey for duplicate detection and tracking';
