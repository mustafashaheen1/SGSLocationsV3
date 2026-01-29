-- Migration: Expand search_properties function to include contacts, address, and owner info
-- Created: 2026-01-29
-- Purpose: Add search capability for property contacts (JSONB), address, and owner information

-- Drop existing function
DROP FUNCTION IF EXISTS search_properties(TEXT);

-- Create expanded function with additional search fields
CREATE OR REPLACE FUNCTION search_properties(search_query TEXT)
RETURNS SETOF properties AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT p.*
  FROM properties p
  LEFT JOIN categories main_cat ON p.category_id = main_cat.id
  LEFT JOIN categories sub_cat ON p.sub_category_id = sub_cat.id
  LEFT JOIN users owner ON p.owner_id = owner.id
  WHERE p.status = 'active'
    AND (
      -- Existing property fields
      p.real_name ILIKE '%' || search_query || '%'
      OR p.name ILIKE '%' || search_query || '%'
      OR p.city ILIKE '%' || search_query || '%'
      OR p.description ILIKE '%' || search_query || '%'

      -- Property tags array
      OR EXISTS (
        SELECT 1
        FROM unnest(p.property_tags) AS tag
        WHERE tag ILIKE '%' || search_query || '%'
      )

      -- Category names
      OR main_cat.name ILIKE '%' || search_query || '%'
      OR sub_cat.name ILIKE '%' || search_query || '%'

      -- NEW: Property address
      OR p.address ILIKE '%' || search_query || '%'

      -- NEW: Property contacts (JSONB array)
      OR EXISTS (
        SELECT 1
        FROM jsonb_array_elements(p.contacts) AS contact
        WHERE
          contact->>'name' ILIKE '%' || search_query || '%'
          OR contact->>'email' ILIKE '%' || search_query || '%'
          OR contact->>'cell_number' ILIKE '%' || search_query || '%'
          OR contact->>'home_number' ILIKE '%' || search_query || '%'
          OR contact->>'office_number' ILIKE '%' || search_query || '%'
      )

      -- NEW: Property owner information (via users table join)
      OR owner.full_name ILIKE '%' || search_query || '%'
      OR owner.email ILIKE '%' || search_query || '%'
      OR owner.phone ILIKE '%' || search_query || '%'
    )
  ORDER BY p.is_exclusive DESC NULLS LAST, p.name ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Add comment explaining the function
COMMENT ON FUNCTION search_properties(TEXT) IS
'Searches properties by name, city, description, tags, categories, address, contacts (JSONB), and owner information (via users table join). Returns active properties only.';
