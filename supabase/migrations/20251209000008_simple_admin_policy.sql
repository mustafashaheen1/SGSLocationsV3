-- Simple admin policy using JWT email directly
-- This should work because JWT always has the email claim

-- Drop all existing SELECT policies on inquiries
DROP POLICY IF EXISTS "Admins can view all inquiries" ON inquiries;
DROP POLICY IF EXISTS "Admins can view all inquiries TEMP" ON inquiries;
DROP POLICY IF EXISTS "Property owners can view property inquiries" ON inquiries;
DROP POLICY IF EXISTS "Producers can view own inquiries" ON inquiries;
DROP POLICY IF EXISTS "Users can view own inquiries" ON inquiries;

-- Policy 1: Users can view their own inquiries
CREATE POLICY "Users view own inquiries"
  ON inquiries FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy 2: Admins can view all inquiries using JWT email
CREATE POLICY "Admins view all inquiries"
  ON inquiries FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() ->> 'email') IN (
      SELECT email FROM admins
    )
  );

-- Policy 3: Property owners can view inquiries for their properties
CREATE POLICY "Property owners view property inquiries"
  ON inquiries FOR SELECT
  TO authenticated
  USING (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );
