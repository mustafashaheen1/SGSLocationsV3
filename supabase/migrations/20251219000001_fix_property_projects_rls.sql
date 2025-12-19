-- Fix RLS policies to use users.user_type instead of non-existent admins table
-- This affects multiple tables that incorrectly reference an admins table

-- ============================================
-- Fix property_projects table
-- ============================================
DROP POLICY IF EXISTS "Admins can view all projects" ON property_projects;
DROP POLICY IF EXISTS "Admins can insert projects" ON property_projects;
DROP POLICY IF EXISTS "Admins can update projects" ON property_projects;
DROP POLICY IF EXISTS "Admins can delete projects" ON property_projects;

CREATE POLICY "Admins can view all projects"
  ON property_projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can insert projects"
  ON property_projects FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can update projects"
  ON property_projects FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can delete projects"
  ON property_projects FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.user_type = 'admin'
    )
  );

-- ============================================
-- Fix documents table
-- ============================================
DROP POLICY IF EXISTS "Admins can view all documents" ON documents;
DROP POLICY IF EXISTS "Admins can insert documents" ON documents;
DROP POLICY IF EXISTS "Admins can update documents" ON documents;
DROP POLICY IF EXISTS "Admins can delete documents" ON documents;

CREATE POLICY "Admins can view all documents"
  ON documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can insert documents"
  ON documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can update documents"
  ON documents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can delete documents"
  ON documents FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.user_type = 'admin'
    )
  );

-- ============================================
-- Fix property_calendar_events table
-- ============================================
DROP POLICY IF EXISTS "Admins can view all calendar events" ON property_calendar_events;
DROP POLICY IF EXISTS "Admins can insert calendar events" ON property_calendar_events;
DROP POLICY IF EXISTS "Admins can update calendar events" ON property_calendar_events;
DROP POLICY IF EXISTS "Admins can delete calendar events" ON property_calendar_events;

CREATE POLICY "Admins can view all calendar events"
  ON property_calendar_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can insert calendar events"
  ON property_calendar_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can update calendar events"
  ON property_calendar_events FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can delete calendar events"
  ON property_calendar_events FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.user_type = 'admin'
    )
  );

-- ============================================
-- Fix favorite_properties table
-- ============================================
DROP POLICY IF EXISTS "Admins can view all favorites" ON favorite_properties;

CREATE POLICY "Admins can view all favorites"
  ON favorite_properties FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.user_type = 'admin'
    )
  );

-- ============================================
-- Fix image_downloads table
-- ============================================
DROP POLICY IF EXISTS "Admins can view download stats" ON image_downloads;

CREATE POLICY "Admins can view download stats"
  ON image_downloads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.user_type = 'admin'
    )
  );

-- ============================================
-- Fix site_content table (if exists)
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'site_content') THEN
    DROP POLICY IF EXISTS "Admins can manage site content" ON site_content;

    CREATE POLICY "Admins can manage site content"
      ON site_content FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.user_type = 'admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.user_type = 'admin'
        )
      );
  END IF;
END $$;

-- ============================================
-- Fix inquiries table (if exists)
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'inquiries') THEN
    DROP POLICY IF EXISTS "Admins can view all inquiries" ON inquiries;
    DROP POLICY IF EXISTS "Admins can update inquiries" ON inquiries;

    CREATE POLICY "Admins can view all inquiries"
      ON inquiries FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.user_type = 'admin'
        )
      );

    CREATE POLICY "Admins can update inquiries"
      ON inquiries FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.user_type = 'admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.user_type = 'admin'
        )
      );
  END IF;
END $$;
