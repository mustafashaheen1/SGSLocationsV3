-- Fix image downloads INSERT policy to work with anon users

DO $$
BEGIN
  -- Drop and recreate the insert policy with explicit roles
  DROP POLICY IF EXISTS "Anyone can track image downloads" ON image_downloads;

  CREATE POLICY "Anyone can track image downloads"
    ON image_downloads FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

  RAISE NOTICE 'Image downloads INSERT policy updated successfully';
END $$;

COMMENT ON POLICY "Anyone can track image downloads" ON image_downloads IS 'Allows all users to track downloads';
