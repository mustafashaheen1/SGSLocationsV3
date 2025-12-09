-- Temporary: Create a very permissive policy for testing
-- This will help us debug if RLS is the issue

-- Drop all existing SELECT policies
DROP POLICY IF EXISTS "Admins can view all inquiries" ON inquiries;
DROP POLICY IF EXISTS "Property owners can view property inquiries" ON inquiries;
DROP POLICY IF EXISTS "Producers can view own inquiries" ON inquiries;

-- Recreate basic policies
-- Policy 1: Users can view their own inquiries
CREATE POLICY "Users can view own inquiries"
  ON inquiries FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy 2: TEMPORARY - Very permissive admin check
-- Check if user's UID is in admins table (if table has user_id column)
-- OR if there's a session at all and they match ANY admin
CREATE POLICY "Admins can view all inquiries TEMP"
  ON inquiries FOR SELECT
  TO authenticated
  USING (
    -- Allow if ANY of these conditions are true:
    -- 1. User owns the inquiry
    user_id = auth.uid()
    OR
    -- 2. Simple check: is there an admin with this exact user ID?
    EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid())
    OR
    -- 3. Check by email using auth metadata
    (SELECT email FROM auth.users WHERE id = auth.uid()) IN (SELECT email FROM admins)
  );

-- Note: Run this query to see admins table structure:
-- SELECT * FROM admins LIMIT 5;
