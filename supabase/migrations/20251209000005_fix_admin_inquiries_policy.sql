-- Fix admin policy to use auth.jwt() to get email directly
-- This resolves the issue where admins couldn't see inquiries

-- Drop the problematic admin policy
DROP POLICY IF EXISTS "Admins can view all inquiries" ON inquiries;

-- Create new admin policy that gets email from JWT token directly
CREATE POLICY "Admins can view all inquiries"
  ON inquiries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.email = (auth.jwt() -> 'email')::text
    )
  );
