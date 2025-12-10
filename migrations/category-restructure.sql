-- ================================================
-- CATEGORY RESTRUCTURE MIGRATION
-- Converts flat categories to hierarchical structure
-- Main categories: Residential, Commercial, Industrial
-- Existing categories become sub-categories
-- ================================================

BEGIN;

-- Step 1: Add parent_id column to categories table
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES categories(id) ON DELETE CASCADE;

-- Step 2: Add sub_category_id column to properties table
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS sub_category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

-- Step 3: Create the 3 main categories
INSERT INTO categories (name, slug, description, image, display_order, is_active, is_top, parent_id)
VALUES
  ('Residential', 'residential', 'Residential properties including homes, apartments, and living spaces', 'https://sgslocations.s3.us-east-1.amazonaws.com/categories/residential.jpg', 1, true, true, NULL),
  ('Commercial', 'commercial', 'Commercial properties including offices, retail, and business spaces', 'https://sgslocations.s3.us-east-1.amazonaws.com/categories/commercial.jpg', 2, true, true, NULL),
  ('Industrial', 'industrial', 'Industrial properties including warehouses, factories, and production facilities', 'https://sgslocations.s3.us-east-1.amazonaws.com/categories/industrial.jpg', 3, true, true, NULL)
ON CONFLICT (slug) DO NOTHING;

-- Step 4: Get the IDs of the main categories for use in the next steps
DO $$
DECLARE
  residential_id UUID;
  commercial_id UUID;
  industrial_id UUID;
  existing_categories RECORD;
  category_index INT := 0;
  main_category_id UUID;
  main_categories UUID[] := ARRAY[]::UUID[];
BEGIN
  -- Get IDs of main categories
  SELECT id INTO residential_id FROM categories WHERE slug = 'residential';
  SELECT id INTO commercial_id FROM categories WHERE slug = 'commercial';
  SELECT id INTO industrial_id FROM categories WHERE slug = 'industrial';

  -- Store in array for round-robin assignment
  main_categories := ARRAY[residential_id, commercial_id, industrial_id];

  -- Loop through all existing categories and randomly assign them to main categories
  FOR existing_categories IN
    SELECT id, name FROM categories
    WHERE parent_id IS NULL
    AND slug NOT IN ('residential', 'commercial', 'industrial')
    ORDER BY display_order
  LOOP
    -- Round-robin assignment to distribute evenly
    main_category_id := main_categories[(category_index % 3) + 1];

    -- Update category to be a sub-category
    UPDATE categories
    SET parent_id = main_category_id,
        is_top = false
    WHERE id = existing_categories.id;

    -- Update properties that use this category
    -- Set category_id to main category, sub_category_id to this sub-category
    UPDATE properties
    SET
      sub_category_id = existing_categories.id,
      category_id = main_category_id
    WHERE category_id = existing_categories.id;

    category_index := category_index + 1;
  END LOOP;

  RAISE NOTICE 'Migration completed: % sub-categories assigned', category_index;
END $$;

-- Step 5: Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_properties_sub_category_id ON properties(sub_category_id);

COMMIT;

-- ================================================
-- VERIFICATION QUERIES (run separately to check)
-- ================================================

-- Check main categories
-- SELECT id, name, slug, parent_id FROM categories WHERE parent_id IS NULL ORDER BY display_order;

-- Check sub-categories grouped by main category
-- SELECT
--   main.name AS main_category,
--   sub.name AS sub_category,
--   sub.id AS sub_category_id
-- FROM categories sub
-- JOIN categories main ON sub.parent_id = main.id
-- ORDER BY main.display_order, sub.display_order;

-- Check properties with categories
-- SELECT
--   p.name AS property_name,
--   main.name AS main_category,
--   sub.name AS sub_category
-- FROM properties p
-- LEFT JOIN categories main ON p.category_id = main.id
-- LEFT JOIN categories sub ON p.sub_category_id = sub.id
-- LIMIT 20;
