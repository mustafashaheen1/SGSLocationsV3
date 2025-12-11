-- Update search_properties function to also search by category and sub-category names
-- This allows users to search by category (e.g., "ranch land") and find all properties in that sub-category

CREATE OR REPLACE FUNCTION search_properties(search_query TEXT)
RETURNS SETOF properties AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT p.*
  FROM properties p
  LEFT JOIN categories main_cat ON p.category_id = main_cat.id
  LEFT JOIN categories sub_cat ON p.sub_category_id = sub_cat.id
  WHERE p.status = 'active'
    AND (
      -- Search in property fields
      p.real_name ILIKE '%' || search_query || '%'
      OR p.name ILIKE '%' || search_query || '%'
      OR p.city ILIKE '%' || search_query || '%'
      OR p.description ILIKE '%' || search_query || '%'

      -- Search in property tags
      OR EXISTS (
        SELECT 1
        FROM unnest(p.property_tags) AS tag
        WHERE tag ILIKE '%' || search_query || '%'
      )

      -- Search in main category name
      OR main_cat.name ILIKE '%' || search_query || '%'

      -- Search in sub-category name
      OR sub_cat.name ILIKE '%' || search_query || '%'
    )
  ORDER BY p.is_exclusive DESC NULLS LAST, p.name ASC;
END;
$$ LANGUAGE plpgsql STABLE;
