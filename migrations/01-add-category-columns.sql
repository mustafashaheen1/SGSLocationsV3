-- ================================================
-- ADD CATEGORY COLUMNS
-- Step 1: Add required columns for hierarchical categories
-- Run this FIRST before running the migration
-- ================================================

-- Add parent_id to categories table
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES categories(id) ON DELETE CASCADE;

-- Add category_id to properties table (main category reference)
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

-- Add sub_category_id to properties table
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS sub_category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_properties_category_id ON properties(category_id);
CREATE INDEX IF NOT EXISTS idx_properties_sub_category_id ON properties(sub_category_id);

-- Verify columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'categories' AND column_name = 'parent_id';

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'properties' AND column_name = 'category_id';

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'properties' AND column_name = 'sub_category_id';
