/*
  # Fix RLS Policy for User Registration

  1. Problem
    - The original INSERT policy requires users to be "authenticated"
    - During signup, Supabase hasn't fully authenticated the user yet
    - This blocks the profile creation step in registration

  2. Solution
    - Remove the "TO authenticated" restriction from INSERT policy
    - Keep the security check: auth.uid() = id
    - This allows signup while maintaining security

  3. Security
    - Users can ONLY insert rows where id = auth.uid()
    - Cannot insert rows for other users
    - auth.uid() comes from Supabase's secure auth system
*/

-- Drop the restrictive INSERT policy
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;

-- Create a new policy that allows signup
-- Removes "TO authenticated" restriction to allow inserts during signup
CREATE POLICY "Users can insert their own profile during signup"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);
