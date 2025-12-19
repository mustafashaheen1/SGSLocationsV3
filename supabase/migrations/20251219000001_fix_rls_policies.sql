-- Fix RLS policies to check admins table using JWT email
-- Admins exist ONLY in the admins table, not in users table

-- ============================================
-- Fix admins table - Allow reading for RLS checks
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admins') THEN
    -- Enable RLS if not already enabled
    ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies if any
    DROP POLICY IF EXISTS "Allow reading admins for RLS checks" ON admins;

    -- Allow all authenticated users to read admins table for RLS policy checks
    -- This is needed so other tables' RLS policies can check admin status
    CREATE POLICY "Allow reading admins for RLS checks"
      ON admins FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

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
      TO authenticated
      USING (
        (auth.jwt() ->> 'email') IN (SELECT email FROM admins)
      );

    CREATE POLICY "Admins can insert projects"
      ON property_projects FOR INSERT
      TO authenticated
      WITH CHECK (
        (auth.jwt() ->> 'email') IN (SELECT email FROM admins)
      );

    CREATE POLICY "Admins can update projects"
      ON property_projects FOR UPDATE
      TO authenticated
      USING (
        (auth.jwt() ->> 'email') IN (SELECT email FROM admins)
      );

    CREATE POLICY "Admins can delete projects"
      ON property_projects FOR DELETE
      TO authenticated
      USING (
        (auth.jwt() ->> 'email') IN (SELECT email FROM admins)
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
      TO authenticated
      USING (
        (auth.jwt() ->> 'email') IN (SELECT email FROM admins)
      );

    CREATE POLICY "Admins can insert documents"
      ON documents FOR INSERT
      TO authenticated
      WITH CHECK (
        (auth.jwt() ->> 'email') IN (SELECT email FROM admins)
      );

    CREATE POLICY "Admins can update documents"
      ON documents FOR UPDATE
      TO authenticated
      USING (
        (auth.jwt() ->> 'email') IN (SELECT email FROM admins)
      );

    CREATE POLICY "Admins can delete documents"
      ON documents FOR DELETE
      TO authenticated
      USING (
        (auth.jwt() ->> 'email') IN (SELECT email FROM admins)
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
    DROP POLICY IF EXISTS "Property owners can view their calendar events" ON property_calendar_events;
    DROP POLICY IF EXISTS "Property owners can insert calendar events" ON property_calendar_events;
    DROP POLICY IF EXISTS "Property owners can update calendar events" ON property_calendar_events;
    DROP POLICY IF EXISTS "Property owners can delete calendar events" ON property_calendar_events;

    -- Admins can view all calendar events
    CREATE POLICY "Admins can view all calendar events"
      ON property_calendar_events FOR SELECT
      TO authenticated
      USING (
        (auth.jwt() ->> 'email') IN (SELECT email FROM admins)
      );

    -- Admins can insert calendar events
    CREATE POLICY "Admins can insert calendar events"
      ON property_calendar_events FOR INSERT
      TO authenticated
      WITH CHECK (
        (auth.jwt() ->> 'email') IN (SELECT email FROM admins)
      );

    -- Admins can update calendar events
    CREATE POLICY "Admins can update calendar events"
      ON property_calendar_events FOR UPDATE
      TO authenticated
      USING (
        (auth.jwt() ->> 'email') IN (SELECT email FROM admins)
      );

    -- Admins can delete calendar events
    CREATE POLICY "Admins can delete calendar events"
      ON property_calendar_events FOR DELETE
      TO authenticated
      USING (
        (auth.jwt() ->> 'email') IN (SELECT email FROM admins)
      );

    -- Property owners can view their own calendar events
    CREATE POLICY "Property owners can view their calendar events"
      ON property_calendar_events FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM properties
          WHERE properties.id = property_calendar_events.property_id
          AND properties.owner_id = auth.uid()
        )
      );

    -- Property owners can insert calendar events on their approved properties
    CREATE POLICY "Property owners can insert calendar events"
      ON property_calendar_events FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM properties
          WHERE properties.id = property_calendar_events.property_id
          AND properties.owner_id = auth.uid()
          AND properties.status = 'active'
        )
      );

    -- Property owners can update calendar events on their approved properties
    CREATE POLICY "Property owners can update calendar events"
      ON property_calendar_events FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM properties
          WHERE properties.id = property_calendar_events.property_id
          AND properties.owner_id = auth.uid()
          AND properties.status = 'active'
        )
      );

    -- Property owners can delete calendar events on their approved properties
    CREATE POLICY "Property owners can delete calendar events"
      ON property_calendar_events FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM properties
          WHERE properties.id = property_calendar_events.property_id
          AND properties.owner_id = auth.uid()
          AND properties.status = 'active'
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
      TO authenticated
      USING (
        (auth.jwt() ->> 'email') IN (SELECT email FROM admins)
      )
      WITH CHECK (
        (auth.jwt() ->> 'email') IN (SELECT email FROM admins)
      );
  END IF;
END $$;
