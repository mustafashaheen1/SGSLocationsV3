-- Trigger to automatically rename properties when their main category changes
-- This implements Option A: Keep gaps in numbering (no renumbering of other properties)

CREATE OR REPLACE FUNCTION auto_rename_property_on_category_change()
RETURNS TRIGGER AS $$
DECLARE
  old_prefix TEXT;
  new_prefix TEXT;
  next_number INTEGER;
  new_name TEXT;
  category_map JSONB := '{
    "8f80a36a-4b0b-41f7-9d47-e24aeac6a8e8": "RES",
    "d25c21ff-9fea-4d80-b41a-01445143f55c": "COM",
    "7475c62f-2110-4cdb-a2e1-f6cb001ddc83": "IND"
  }'::JSONB;
BEGIN
  -- Only proceed if category_id has changed
  IF NEW.category_id IS DISTINCT FROM OLD.category_id THEN

    -- Get the prefix for the old category
    old_prefix := category_map->>OLD.category_id::TEXT;

    -- Get the prefix for the new category
    new_prefix := category_map->>NEW.category_id::TEXT;

    -- Only rename if both categories are main categories and they're different
    IF old_prefix IS NOT NULL AND new_prefix IS NOT NULL AND old_prefix != new_prefix THEN

      -- Find the next available number for the new category
      -- This finds the maximum number currently used and adds 1
      SELECT COALESCE(MAX(
        CASE
          WHEN name ~ ('^' || new_prefix || '-[0-9]{4}$')
          THEN CAST(SUBSTRING(name FROM '[0-9]{4}$') AS INTEGER)
          ELSE 0
        END
      ), 0) + 1 INTO next_number
      FROM properties
      WHERE category_id = NEW.category_id;

      -- Format the new name with zero-padded number
      new_name := new_prefix || '-' || LPAD(next_number::TEXT, 4, '0');

      -- Update the name
      NEW.name := new_name;

      -- Log the change
      RAISE NOTICE 'Property % renamed from % to % due to category change from % to %',
        NEW.id, OLD.name, new_name, old_prefix, new_prefix;

    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS trigger_auto_rename_on_category_change ON properties;

-- Create the trigger
CREATE TRIGGER trigger_auto_rename_on_category_change
  BEFORE UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION auto_rename_property_on_category_change();

-- Add a comment
COMMENT ON FUNCTION auto_rename_property_on_category_change() IS
'Automatically renames properties when their main category changes.
Uses Option A: Keeps gaps in numbering (no cascade renumbering).
Main categories: Residential (RES), Commercial (COM), Industrial (IND)';
