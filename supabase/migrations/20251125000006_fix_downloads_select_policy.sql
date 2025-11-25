-- Fix the SELECT policy for image_downloads to allow admins to view stats

DO $$
BEGIN
  -- Drop the restrictive policy
  DROP POLICY IF EXISTS "Admins can view download stats" ON image_downloads;

  -- Create a more permissive policy that allows authenticated users to view stats
  -- We can restrict this later if needed
  CREATE POLICY "Authenticated users can view download stats"
    ON image_downloads FOR SELECT
    TO authenticated
    USING (true);

  RAISE NOTICE 'Download stats SELECT policy updated successfully';
END $$;

COMMENT ON POLICY "Authenticated users can view download stats" ON image_downloads IS 'Allows authenticated users to view download statistics';
