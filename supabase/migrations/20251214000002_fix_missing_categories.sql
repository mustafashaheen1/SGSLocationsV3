-- Fix properties with missing category_id or sub_category_id
-- This script assigns category and sub-category to properties that don't have them

-- Step 1: For properties with "Industrial" in categories array but no sub_category_id
-- Find an appropriate Industrial sub-category and assign it
UPDATE properties
SET
  sub_category_id = (
    SELECT id
    FROM categories
    WHERE LOWER(name) LIKE '%industrial%'
      AND parent_id IS NOT NULL
      AND is_active = true
    LIMIT 1
  ),
  category_id = COALESCE(
    category_id,
    (
      SELECT parent_id
      FROM categories
      WHERE LOWER(name) LIKE '%industrial%'
        AND parent_id IS NOT NULL
        AND is_active = true
      LIMIT 1
    )
  )
WHERE 'Industrial' = ANY(categories)
  AND sub_category_id IS NULL;

-- Step 2: For properties with empty categories array
-- Assign a random sub-category and its parent category
UPDATE properties
SET
  sub_category_id = (
    SELECT id
    FROM categories
    WHERE parent_id IS NOT NULL
      AND is_active = true
    ORDER BY RANDOM()
    LIMIT 1
  ),
  category_id = (
    SELECT parent_id
    FROM categories
    WHERE parent_id IS NOT NULL
      AND is_active = true
    ORDER BY RANDOM()
    LIMIT 1
  ),
  categories = ARRAY[(
    SELECT name
    FROM categories
    WHERE parent_id IS NOT NULL
      AND is_active = true
    ORDER BY RANDOM()
    LIMIT 1
  )]
WHERE categories = '{}' OR categories IS NULL;

-- Step 3: For any remaining properties without sub_category_id
-- Assign based on their categories array (match by name)
UPDATE properties p
SET
  sub_category_id = c.id,
  category_id = c.parent_id
FROM (
  SELECT DISTINCT ON (p2.id) p2.id as property_id, c2.id, c2.parent_id
  FROM properties p2
  CROSS JOIN categories c2
  WHERE p2.sub_category_id IS NULL
    AND c2.parent_id IS NOT NULL
    AND c2.is_active = true
    AND c2.name = ANY(p2.categories)
) c
WHERE p.id = c.property_id;

-- Step 4: Final fallback - assign a default sub-category to any remaining properties
UPDATE properties
SET
  sub_category_id = (
    SELECT id
    FROM categories
    WHERE parent_id IS NOT NULL
      AND is_active = true
    ORDER BY display_order
    LIMIT 1
  ),
  category_id = (
    SELECT parent_id
    FROM categories
    WHERE parent_id IS NOT NULL
      AND is_active = true
    ORDER BY display_order
    LIMIT 1
  ),
  categories = CASE
    WHEN categories = '{}' OR categories IS NULL THEN
      ARRAY[(
        SELECT name
        FROM categories
        WHERE parent_id IS NOT NULL
          AND is_active = true
        ORDER BY display_order
        LIMIT 1
      )]
    ELSE categories
  END
WHERE sub_category_id IS NULL OR category_id IS NULL;

-- Verify the fix
SELECT
  COUNT(*) FILTER (WHERE category_id IS NULL OR sub_category_id IS NULL) as properties_with_missing_categories,
  COUNT(*) as total_properties
FROM properties;
