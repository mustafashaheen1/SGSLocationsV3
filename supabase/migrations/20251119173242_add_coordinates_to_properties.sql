/*
  # Add Geographic Coordinates to Properties

  1. Changes
    - Add `latitude` column (numeric) to properties table
    - Add `longitude` column (numeric) to properties table

  2. Purpose
    - Enable distance-based "Nearby Locations" feature
    - Store geographic coordinates from Google Places Autocomplete
    - Support proximity-based property searches

  3. Notes
    - Coordinates are captured automatically when using Google Autocomplete
    - Allows calculation of accurate distances between properties
    - Essential for "X miles away" feature on property detail pages
*/

-- Add latitude and longitude columns to properties table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE properties ADD COLUMN latitude numeric(10, 8);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE properties ADD COLUMN longitude numeric(11, 8);
  END IF;
END $$;

-- Add comment to columns
COMMENT ON COLUMN properties.latitude IS 'Geographic latitude from Google Places API';
COMMENT ON COLUMN properties.longitude IS 'Geographic longitude from Google Places API';
