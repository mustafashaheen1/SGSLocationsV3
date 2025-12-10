# Category Migration Instructions

## Overview

The categories system has been restructured to use a hierarchical model:
- **3 Main Categories**: Residential, Commercial, Industrial
- **Sub-Categories**: All existing categories become sub-categories under the 3 main categories
- **Properties**: Now reference both a main category and a sub-category

## Migration Steps

### Step 1: Add Database Columns

1. Log in to your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Run the SQL from `/migrations/01-add-category-columns.sql`:

```sql
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
```

4. Verify the columns were added:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'categories' AND column_name = 'parent_id';

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'properties' AND column_name = 'category_id';

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'properties' AND column_name = 'sub_category_id';
```

### Step 2: Run the Migration

1. Start your development server:
```bash
npm run dev
```

2. Navigate to: `http://localhost:3000/admin/migrate-categories`

3. Click the **"Run Category Migration"** button

4. The migration will:
   - Create 3 main categories (Residential, Commercial, Industrial)
   - Convert all existing categories to sub-categories
   - Distribute existing categories evenly across the 3 main categories (round-robin)
   - Update all properties to reference both main category and sub-category

5. Review the results:
   - Number of main categories created: 3
   - Number of sub-categories converted
   - Property distribution across main categories
   - Any errors that occurred

## What Changed

### Database Schema

**categories table:**
- Added `parent_id` column (UUID, nullable, references categories.id)
- Main categories have `parent_id = null`
- Sub-categories have `parent_id` pointing to a main category

**properties table:**
- Added `sub_category_id` column (UUID, nullable, references categories.id)
- `category_id` now points to main category (Residential/Commercial/Industrial)
- `sub_category_id` points to specific sub-category
- `categories` array contains names of both main category and sub-category

### UI Changes

**Admin Property Edit Page** (`/app/admin/properties/[id]/edit/page.tsx`):
- Single "Category" dropdown replaced with:
  - **Main Category** dropdown (Residential, Commercial, Industrial)
  - **Sub-Category** dropdown (filtered by selected main category)
- Sub-category dropdown is disabled until main category is selected

**Search Page** (`/app/search/page.tsx`):
- Added two new filter dropdowns before existing filters:
  - **Main Category** dropdown
  - **Sub-Category** dropdown (filtered by selected main category)
- Properties are filtered by selected main category and/or sub-category
- Dropdowns turn red when a selection is made (consistent with existing filters)

### API Changes

**Property Queries**:
- All property queries now support filtering by:
  - `category_id` (main category)
  - `sub_category_id` (sub-category)
- Search results properly filter based on category selections

## Migration Results

After migration, you should see:
- 3 main categories with `parent_id = null`
- All previous categories converted to sub-categories with `parent_id` set
- All properties updated with:
  - `category_id` pointing to a main category
  - `sub_category_id` pointing to their original category
  - `categories` array containing both category names

## Example Distribution

If you had these categories before migration:
1. House
2. Apartment
3. Office
4. Retail Store
5. Warehouse
6. Factory

After migration (round-robin assignment):
- **Residential**
  - House
  - Warehouse
- **Commercial**
  - Apartment
  - Factory
- **Industrial**
  - Office
  - Retail Store

You can manually reassign sub-categories to different main categories through the admin panel after the migration if needed.

## Rollback (if needed)

If you need to rollback:

```sql
-- Remove the new columns
ALTER TABLE categories DROP COLUMN IF EXISTS parent_id;
ALTER TABLE properties DROP COLUMN IF EXISTS category_id;
ALTER TABLE properties DROP COLUMN IF EXISTS sub_category_id;

-- Drop the indexes
DROP INDEX IF EXISTS idx_categories_parent_id;
DROP INDEX IF EXISTS idx_properties_category_id;
DROP INDEX IF EXISTS idx_properties_sub_category_id;
```

Then refresh your codebase to the previous version.

## Verifying the Migration

### Check Categories Structure
```sql
-- View main categories
SELECT id, name, slug, parent_id
FROM categories
WHERE parent_id IS NULL
ORDER BY display_order;

-- View sub-categories by main category
SELECT
  main.name AS main_category,
  sub.name AS sub_category,
  sub.id AS sub_category_id
FROM categories sub
JOIN categories main ON sub.parent_id = main.id
ORDER BY main.display_order, sub.display_order;
```

### Check Properties
```sql
-- View properties with their categories
SELECT
  p.name AS property_name,
  main.name AS main_category,
  sub.name AS sub_category
FROM properties p
LEFT JOIN categories main ON p.category_id = main.id
LEFT JOIN categories sub ON p.sub_category_id = sub.id
LIMIT 20;

-- Count properties by main category
SELECT
  main.name AS category,
  COUNT(p.id) AS property_count
FROM categories main
LEFT JOIN properties p ON p.category_id = main.id
WHERE main.parent_id IS NULL
GROUP BY main.id, main.name
ORDER BY main.display_order;
```

## Support

If you encounter any issues:
1. Check the Supabase logs for database errors
2. Check the browser console for frontend errors
3. Review the migration page for specific error messages
4. Verify the database columns were created correctly

All migration files are located in `/migrations/` and the migration admin page is at `/app/admin/migrate-categories/page.tsx`.
