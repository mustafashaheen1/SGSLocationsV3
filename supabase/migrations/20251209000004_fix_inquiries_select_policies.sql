-- Fix inquiries table SELECT policies to avoid querying auth.users
-- This resolves "permission denied for table users" error when fetching inquiries

-- Drop existing SELECT policies
DROP POLICY IF EXISTS "Admins can view all inquiries" ON inquiries;
DROP POLICY IF EXISTS "Property owners can view their inquiries and property inquiries" ON inquiries;
DROP POLICY IF EXISTS "Users can view their own inquiries" ON inquiries;
DROP POLICY IF EXISTS "Producers can view their own inquiries" ON inquiries;

-- Admins can view all inquiries (check admins table instead of auth.users)
CREATE POLICY "Admins can view all inquiries"
  ON inquiries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.email = (SELECT email FROM public.users WHERE id = auth.uid())
    )
  );

-- Property owners can view their own inquiries + inquiries for their properties
CREATE POLICY "Property owners can view property inquiries"
  ON inquiries FOR SELECT
  TO authenticated
  USING (
    -- Their own inquiries
    user_id = auth.uid()
    OR
    -- Inquiries for properties they own
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );

-- Producers can view their own inquiries
CREATE POLICY "Producers can view own inquiries"
  ON inquiries FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
