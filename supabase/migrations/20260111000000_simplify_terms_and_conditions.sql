-- Migration: Simplify terms_and_conditions table
-- Remove is_active and version columns, add singleton constraint

-- Step 1: Drop RLS policies that depend on is_active column (MUST BE DONE FIRST)
DROP POLICY IF EXISTS "Public can view active terms" ON terms_and_conditions;
DROP POLICY IF EXISTS "Authenticated users can view all terms" ON terms_and_conditions;
DROP POLICY IF EXISTS "Only admins can manage terms" ON terms_and_conditions;

-- Step 2: Delete all inactive terms (keep only the active one)
DELETE FROM terms_and_conditions WHERE is_active = false;

-- Step 3: Drop the index on is_active (before dropping column)
DROP INDEX IF EXISTS idx_terms_is_active;

-- Step 4: Drop the is_active column (after policies and index are dropped)
ALTER TABLE terms_and_conditions DROP COLUMN IF EXISTS is_active;

-- Step 5: Drop the version column
ALTER TABLE terms_and_conditions DROP COLUMN IF EXISTS version;

-- Step 6: Ensure there's exactly one record (create if missing)
INSERT INTO terms_and_conditions (content)
SELECT 'Default Terms and Conditions - Please update in Admin Panel'
WHERE NOT EXISTS (SELECT 1 FROM terms_and_conditions);

-- Step 7: Add singleton constraint to ensure only one record exists
ALTER TABLE terms_and_conditions ADD COLUMN singleton BOOLEAN DEFAULT true;
ALTER TABLE terms_and_conditions ADD CONSTRAINT terms_singleton_check UNIQUE (singleton);

-- Add comment to explain the singleton pattern
COMMENT ON COLUMN terms_and_conditions.singleton IS
'Singleton constraint - ensures only one record exists in the table. Always set to true.';
