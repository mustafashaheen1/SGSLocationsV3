/*
  # Add Original Image URL Tracking to Property Images

  1. Changes
    - Add `original_image_url` column to `property_images` table
    - Backfill existing records with current `image_url` as `original_image_url`
    - Add indexes for performance optimization

  2. Purpose
    - Track original uploaded images separately from edited versions
    - Enable restore functionality for edited images
    - Prevent orphaned S3 files from accumulating
*/

-- Add original_image_url column (nullable for safe migration)
ALTER TABLE property_images
ADD COLUMN IF NOT EXISTS original_image_url text;

-- Backfill existing data: set original = current for all images
UPDATE property_images
SET original_image_url = image_url
WHERE original_image_url IS NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_property_images_original_url
  ON property_images(original_image_url);

-- Index for finding edited images (where URLs differ)
CREATE INDEX IF NOT EXISTS idx_property_images_edited
  ON property_images(property_id, id)
  WHERE image_url != original_image_url;

-- Document the column
COMMENT ON COLUMN property_images.original_image_url IS
  'Original uploaded image URL. Remains unchanged when image is edited. Used for restore functionality.';
