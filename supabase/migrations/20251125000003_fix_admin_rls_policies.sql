-- Fix all RLS policies to use admins table instead of users.is_admin

DO $$
BEGIN
  -- Fix site_content policies if table exists
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'site_content') THEN
    DROP POLICY IF EXISTS "Admins can manage site content" ON site_content;

    CREATE POLICY "Admins can manage site content"
      ON site_content FOR ALL
      TO authenticated
      USING (EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid()))
      WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid()));
  END IF;

  -- Fix inquiries policies if table exists
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'inquiries') THEN
    DROP POLICY IF EXISTS "Admins can view all inquiries" ON inquiries;
    DROP POLICY IF EXISTS "Admins can update inquiries" ON inquiries;

    CREATE POLICY "Admins can view all inquiries"
      ON inquiries FOR SELECT
      TO authenticated
      USING (EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid()));

    CREATE POLICY "Admins can update inquiries"
      ON inquiries FOR UPDATE
      TO authenticated
      USING (EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid()))
      WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid()));
  END IF;
END $$;
