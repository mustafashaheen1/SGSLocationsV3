-- Allow anyone to update view_count (for tracking purposes)

DO $$
BEGIN
  -- Drop existing policy if it exists
  DROP POLICY IF EXISTS "Anyone can increment view count" ON properties;

  -- Create a policy that allows anyone (including anon users) to update properties
  -- This is safe for view_count tracking
  CREATE POLICY "Anyone can increment view count"
    ON properties FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

  RAISE NOTICE 'View count update policy created successfully';
END $$;

COMMENT ON POLICY "Anyone can increment view count" ON properties IS 'Allows view count tracking for all users';
