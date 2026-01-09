-- Add main category management support with auto-generated prefixes
-- This migration adds the ability for admins to create new main categories
-- with automatic 3-letter prefix generation for property naming

-- Step 1: Add prefix column to categories table
ALTER TABLE categories ADD COLUMN IF NOT EXISTS prefix TEXT;

-- Step 2: Populate existing main categories with their prefixes
UPDATE categories SET prefix = 'RES' WHERE name = 'Residential' AND parent_id IS NULL;
UPDATE categories SET prefix = 'COM' WHERE name = 'Commercial' AND parent_id IS NULL;
UPDATE categories SET prefix = 'IND' WHERE name = 'Industrial' AND parent_id IS NULL;

-- Step 3: Create unique index on prefix for main categories
-- This ensures no two main categories can have the same prefix
CREATE UNIQUE INDEX IF NOT EXISTS unique_main_category_prefix
ON categories (prefix)
WHERE parent_id IS NULL AND prefix IS NOT NULL;

-- Step 4: Create function to generate unique prefixes
CREATE OR REPLACE FUNCTION generate_unique_prefix(category_name TEXT)
RETURNS TEXT AS $$
DECLARE
  cleaned_name TEXT;
  prefix_candidate TEXT;
  exists_check BOOLEAN;
  word_count INT;
  words TEXT[];
  counter INT := 2;
BEGIN
  -- Remove all non-alphabetic characters and convert to uppercase
  cleaned_name := UPPER(REGEXP_REPLACE(category_name, '[^a-zA-Z ]', '', 'g'));

  -- Remove extra spaces
  cleaned_name := REGEXP_REPLACE(cleaned_name, '\s+', ' ', 'g');
  cleaned_name := TRIM(cleaned_name);

  -- Strategy 1: First 3 letters of single word or combined words
  prefix_candidate := LEFT(REPLACE(cleaned_name, ' ', ''), 3);
  IF LENGTH(prefix_candidate) = 3 THEN
    SELECT EXISTS(
      SELECT 1 FROM categories
      WHERE prefix = prefix_candidate AND parent_id IS NULL
    ) INTO exists_check;
    IF NOT exists_check THEN RETURN prefix_candidate; END IF;
  END IF;

  -- Strategy 2: First letter of each word (for multi-word names)
  IF cleaned_name ~ ' ' THEN
    words := STRING_TO_ARRAY(cleaned_name, ' ');
    word_count := ARRAY_LENGTH(words, 1);

    IF word_count >= 3 THEN
      -- Take first letter of first 3 words
      prefix_candidate := LEFT(words[1], 1) || LEFT(words[2], 1) || LEFT(words[3], 1);
    ELSIF word_count = 2 THEN
      -- Take first letter of each word + first letter again
      prefix_candidate := LEFT(words[1], 1) || LEFT(words[2], 1) || LEFT(words[1], 2);
      prefix_candidate := LEFT(prefix_candidate, 3);
    END IF;

    IF LENGTH(prefix_candidate) = 3 THEN
      SELECT EXISTS(
        SELECT 1 FROM categories
        WHERE prefix = prefix_candidate AND parent_id IS NULL
      ) INTO exists_check;
      IF NOT exists_check THEN RETURN prefix_candidate; END IF;
    END IF;
  END IF;

  -- Strategy 3: First letter + last 2 letters
  IF LENGTH(REPLACE(cleaned_name, ' ', '')) >= 3 THEN
    cleaned_name := REPLACE(cleaned_name, ' ', '');
    prefix_candidate := LEFT(cleaned_name, 1) || RIGHT(cleaned_name, 2);

    SELECT EXISTS(
      SELECT 1 FROM categories
      WHERE prefix = prefix_candidate AND parent_id IS NULL
    ) INTO exists_check;
    IF NOT exists_check THEN RETURN prefix_candidate; END IF;
  END IF;

  -- Strategy 4: First 2 letters + last letter
  IF LENGTH(REPLACE(cleaned_name, ' ', '')) >= 3 THEN
    cleaned_name := REPLACE(cleaned_name, ' ', '');
    prefix_candidate := LEFT(cleaned_name, 2) || RIGHT(cleaned_name, 1);

    SELECT EXISTS(
      SELECT 1 FROM categories
      WHERE prefix = prefix_candidate AND parent_id IS NULL
    ) INTO exists_check;
    IF NOT exists_check THEN RETURN prefix_candidate; END IF;
  END IF;

  -- Strategy 5: Remove vowels and take first 3 consonants
  cleaned_name := REPLACE(cleaned_name, ' ', '');
  cleaned_name := REGEXP_REPLACE(cleaned_name, '[AEIOU]', '', 'g');
  IF LENGTH(cleaned_name) >= 3 THEN
    prefix_candidate := LEFT(cleaned_name, 3);

    SELECT EXISTS(
      SELECT 1 FROM categories
      WHERE prefix = prefix_candidate AND parent_id IS NULL
    ) INTO exists_check;
    IF NOT exists_check THEN RETURN prefix_candidate; END IF;
  END IF;

  -- Strategy 6: Numbered fallback - take first 2 letters and add number
  cleaned_name := UPPER(REGEXP_REPLACE(category_name, '[^a-zA-Z]', '', 'g'));
  prefix_candidate := LEFT(cleaned_name, 2);

  LOOP
    EXIT WHEN counter > 99; -- Safety limit

    prefix_candidate := LEFT(cleaned_name, 2) || counter::TEXT;

    SELECT EXISTS(
      SELECT 1 FROM categories
      WHERE prefix = prefix_candidate AND parent_id IS NULL
    ) INTO exists_check;

    IF NOT exists_check THEN RETURN prefix_candidate; END IF;

    counter := counter + 1;
  END LOOP;

  -- Ultimate fallback (should never reach here)
  RETURN 'UNK';
END;
$$ LANGUAGE plpgsql;

-- Add comment to explain the function
COMMENT ON FUNCTION generate_unique_prefix(TEXT) IS
'Generates a unique 3-letter prefix for a main category based on its name.
Tries multiple strategies:
1. First 3 letters
2. First letter of each word (multi-word names)
3. First + last 2 letters
4. First 2 + last letter
5. Vowel removal (consonants only)
6. Numbered fallback (XX2, XX3, etc.)
Returns the first unique prefix found.';

-- Step 5: Update get_category_prefix() to use the new prefix column
CREATE OR REPLACE FUNCTION get_category_prefix(cat_id UUID)
RETURNS TEXT AS $$
DECLARE
  main_category_id UUID;
  category_prefix TEXT;
BEGIN
  -- Get the main category (either the category itself or its parent)
  SELECT
    CASE
      WHEN c.parent_id IS NULL THEN c.id
      ELSE c.parent_id
    END
  INTO main_category_id
  FROM categories c
  WHERE c.id = cat_id;

  -- Return the prefix from the main category
  SELECT prefix INTO category_prefix
  FROM categories
  WHERE id = main_category_id;

  -- Return the prefix, or 'UNK' if not found
  RETURN COALESCE(category_prefix, 'UNK');
END;
$$ LANGUAGE plpgsql STABLE;

-- Add comment
COMMENT ON FUNCTION get_category_prefix(UUID) IS
'Gets the 3-letter prefix for a category (used for property naming).
For sub-categories, returns the parent category''s prefix.
For main categories, returns their own prefix.';
