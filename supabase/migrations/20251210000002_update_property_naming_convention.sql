-- Update property naming convention to use category-based prefixes with sequential numbering
-- Format: [CATEGORY_PREFIX]-[SEQUENTIAL_NUMBER]
-- Examples: COM-0001, RES-0002, IND-0003

-- First, let's create a function to get the category prefix
CREATE OR REPLACE FUNCTION get_category_prefix(cat_id UUID)
RETURNS TEXT AS $$
DECLARE
  main_category_id UUID;
  category_name TEXT;
BEGIN
  -- Get the main category (either the category itself or its parent)
  SELECT
    CASE
      WHEN c.parent_id IS NULL THEN c.id
      ELSE c.parent_id
    END,
    CASE
      WHEN c.parent_id IS NULL THEN c.name
      ELSE parent.name
    END
  INTO main_category_id, category_name
  FROM categories c
  LEFT JOIN categories parent ON c.parent_id = parent.id
  WHERE c.id = cat_id;

  -- Return the appropriate prefix based on the main category
  RETURN CASE
    WHEN category_name = 'Commercial' THEN 'COM'
    WHEN category_name = 'Residential' THEN 'RES'
    WHEN category_name = 'Industrial' THEN 'IND'
    ELSE 'UNK' -- Unknown category
  END;
END;
$$ LANGUAGE plpgsql STABLE;

-- Update all existing properties with the new naming convention
DO $$
DECLARE
  prop RECORD;
  category_prefix TEXT;
  property_number INT;
  new_name TEXT;
  com_counter INT := 0;
  res_counter INT := 0;
  ind_counter INT := 0;
BEGIN
  -- Process all properties ordered by created_at to maintain chronological order
  FOR prop IN
    SELECT p.id, p.category_id, p.created_at
    FROM properties p
    ORDER BY p.created_at ASC, p.id ASC
  LOOP
    -- Get the category prefix for this property
    category_prefix := get_category_prefix(prop.category_id);

    -- Increment the appropriate counter and assign the number
    IF category_prefix = 'COM' THEN
      com_counter := com_counter + 1;
      property_number := com_counter;
    ELSIF category_prefix = 'RES' THEN
      res_counter := res_counter + 1;
      property_number := res_counter;
    ELSIF category_prefix = 'IND' THEN
      ind_counter := ind_counter + 1;
      property_number := ind_counter;
    ELSE
      -- For unknown categories, just use a generic counter
      property_number := 9999;
    END IF;

    -- Format the new name
    new_name := category_prefix || '-' || LPAD(property_number::TEXT, 4, '0');

    -- Update the property
    UPDATE properties
    SET name = new_name
    WHERE id = prop.id;

    RAISE NOTICE 'Updated property % to %', prop.id, new_name;
  END LOOP;
END $$;

-- Create a function to generate the next property name for a given category
CREATE OR REPLACE FUNCTION get_next_property_name(cat_id UUID)
RETURNS TEXT AS $$
DECLARE
  category_prefix TEXT;
  max_number INT;
  next_number INT;
BEGIN
  -- Get the category prefix
  category_prefix := get_category_prefix(cat_id);

  -- Find the highest number currently in use for this category prefix
  SELECT COALESCE(
    MAX(
      NULLIF(
        regexp_replace(
          SUBSTRING(name FROM category_prefix || '-(\d{4})'),
          '[^0-9]',
          '',
          'g'
        ),
        ''
      )::INT
    ),
    0
  )
  INTO max_number
  FROM properties
  WHERE name LIKE category_prefix || '-%';

  -- Calculate next number
  next_number := max_number + 1;

  -- Return formatted name
  RETURN category_prefix || '-' || LPAD(next_number::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql STABLE;

-- Add a comment explaining the naming convention
COMMENT ON FUNCTION get_next_property_name(UUID) IS
'Generates the next sequential property name based on category.
Format: [PREFIX]-[NUMBER] where PREFIX is COM (Commercial), RES (Residential), or IND (Industrial).
Numbers are zero-padded to 4 digits (e.g., COM-0001, RES-0042, IND-0123).';
