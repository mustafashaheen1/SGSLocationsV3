-- Update search_properties function to search in real_name field as well
-- This allows users to search by the actual property name even when
-- the public display name is different (e.g., searching "7-eleven" will find "property-7815")

CREATE OR REPLACE FUNCTION search_properties(search_query TEXT)
RETURNS SETOF properties AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM properties
  WHERE status = 'active'
    AND (
      real_name ILIKE '%' || search_query || '%'
      OR name ILIKE '%' || search_query || '%'
      OR city ILIKE '%' || search_query || '%'
      OR description ILIKE '%' || search_query || '%'
      OR EXISTS (
        SELECT 1
        FROM unnest(property_tags) AS tag
        WHERE tag ILIKE '%' || search_query || '%'
      )
    )
  ORDER BY is_exclusive DESC NULLS LAST, name ASC;
END;
$$ LANGUAGE plpgsql STABLE;
