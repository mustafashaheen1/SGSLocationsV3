-- Migration: Update RLS policies for terms_and_conditions
-- Simplify policies since we now have only one record
-- Note: Old policies were already dropped in the previous migration

-- Step 1: Create simplified public SELECT policy
CREATE POLICY "Public can view terms"
ON terms_and_conditions
FOR SELECT
TO anon, authenticated
USING (true);  -- No filtering needed, only one record exists

-- Step 2: Create admin UPDATE policy
CREATE POLICY "Admins can update terms"
ON terms_and_conditions
FOR UPDATE
TO authenticated
USING (
  (auth.jwt() ->> 'email') IN (SELECT email FROM admins)
)
WITH CHECK (
  (auth.jwt() ->> 'email') IN (SELECT email FROM admins)
);

-- Note: No INSERT or DELETE policies needed
-- - The migration ensures exactly one record exists
-- - The singleton constraint prevents additional inserts
-- - Admins should only UPDATE, not delete/insert
