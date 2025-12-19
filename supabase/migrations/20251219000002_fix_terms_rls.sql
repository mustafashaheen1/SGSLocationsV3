-- Fix terms_and_conditions RLS to allow admins to view all versions

-- Drop ALL existing SELECT policies (there might be variations)
DROP POLICY IF EXISTS "Anyone can view active terms" ON terms_and_conditions;
DROP POLICY IF EXISTS "Public can view active terms" ON terms_and_conditions;
DROP POLICY IF EXISTS "Authenticated users can view all terms" ON terms_and_conditions;

-- Public (non-authenticated) can only view active terms
CREATE POLICY "Public can view active terms"
  ON terms_and_conditions
  FOR SELECT
  TO anon
  USING (is_active = true);

-- Authenticated users (admins) can view all terms (including inactive)
CREATE POLICY "Authenticated users can view all terms"
  ON terms_and_conditions
  FOR SELECT
  TO authenticated
  USING (true);
