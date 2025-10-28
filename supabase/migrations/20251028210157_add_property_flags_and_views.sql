/*
  # Add property flags and view tracking

  1. Changes
    - Add `is_exclusive` boolean column to mark exclusive properties
    - Add `is_featured` boolean column to mark featured properties  
    - Add `view_count` integer column to track property views
  
  2. Notes
    - All columns default to false/0 for existing properties
    - These columns support filtering and sorting for discovery features
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'is_exclusive'
  ) THEN
    ALTER TABLE properties ADD COLUMN is_exclusive boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'is_featured'
  ) THEN
    ALTER TABLE properties ADD COLUMN is_featured boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'view_count'
  ) THEN
    ALTER TABLE properties ADD COLUMN view_count integer DEFAULT 0;
  END IF;
END $$;
