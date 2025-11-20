-- Create a function to search properties including tags
CREATE OR REPLACE FUNCTION search_properties(search_query TEXT)
RETURNS SETOF properties AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM properties
  WHERE status = 'active'
    AND (
      name ILIKE '%' || search_query || '%'
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
