-- Fix admin policy to check by user ID instead of email
-- First, let's add a user_id column to admins table if it doesn't exist

-- Add user_id column to admins table
ALTER TABLE admins ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_admins_user_id ON admins(user_id);

-- Drop the email-based admin policy
DROP POLICY IF EXISTS "Admins can view all inquiries" ON inquiries;

-- Create new admin policy that checks user_id directly
CREATE POLICY "Admins can view all inquiries"
  ON inquiries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.email = (auth.jwt() ->> 'email')
    )
  );

-- Show admins table structure for debugging
COMMENT ON POLICY "Admins can view all inquiries" ON inquiries IS
  'Allows admins to view all inquiries by checking both user_id and email in admins table';
