-- Fix users table RLS policies to allow authenticated users to read their own data
-- This resolves "permission denied for table users" error when creating inquiries

-- Enable RLS on users table if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can view their own data" ON users;

-- Allow authenticated users to read their own user data
CREATE POLICY "Users can view their own data"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow authenticated users to read all users (needed for some queries)
DROP POLICY IF EXISTS "Authenticated users can view all users" ON users;
CREATE POLICY "Authenticated users can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (true);
