-- Fix RLS policies to use users.user_type instead of non-existent admins table
-- This affects multiple tables that incorrectly reference an admins table

-- ============================================
-- Fix property_projects table (if exists)
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'property_projects') THEN
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
  END IF;
END $$;

-- ============================================
-- Fix documents table (if exists)
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'documents') THEN
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
  END IF;
END $$;

-- ============================================
-- Fix property_calendar_events table (if exists)
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'property_calendar_events') THEN
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
  END IF;
END $$;

-- ============================================
-- Fix site_settings table - Add RLS policies
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'site_settings') THEN
    -- Enable RLS if not already enabled
    ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies if any
    DROP POLICY IF EXISTS "Admins can manage site settings" ON site_settings;
    DROP POLICY IF EXISTS "Anyone can view site settings" ON site_settings;

    -- Anyone can view site settings
    CREATE POLICY "Anyone can view site settings"
      ON site_settings FOR SELECT
      USING (true);

    -- Only admins can insert/update/delete site settings
    CREATE POLICY "Admins can manage site settings"
      ON site_settings FOR ALL
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
