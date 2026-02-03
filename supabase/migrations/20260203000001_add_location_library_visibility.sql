-- Migration: Add Location Library Visibility to Categories
-- Date: 2026-02-03
-- Description: Adds a boolean flag to control which sub-categories appear as tabs in the location library page

-- Add location library visibility to categories (default true - all sub-categories visible by default)
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS show_in_location_library BOOLEAN DEFAULT true;

-- Create partial index for optimal query performance (only on sub-categories)
CREATE INDEX IF NOT EXISTS idx_categories_location_library
ON categories(show_in_location_library, parent_id, is_active)
WHERE parent_id IS NOT NULL;

-- Add helpful comment
COMMENT ON COLUMN categories.show_in_location_library IS
'Controls whether this sub-category appears as a tab in the location library page. Only applicable to sub-categories (parent_id IS NOT NULL). Defaults to false.';
