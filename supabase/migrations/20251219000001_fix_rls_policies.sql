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
        OR
        EXISTS (
          SELECT 1 FROM admins
          JOIN auth.users ON auth.users.email = admins.email
          WHERE auth.users.id = auth.uid()
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
        OR
        EXISTS (
          SELECT 1 FROM admins
          JOIN auth.users ON auth.users.email = admins.email
          WHERE auth.users.id = auth.uid()
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
        OR
        EXISTS (
          SELECT 1 FROM admins
          JOIN auth.users ON auth.users.email = admins.email
          WHERE auth.users.id = auth.uid()
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
        OR
        EXISTS (
          SELECT 1 FROM admins
          JOIN auth.users ON auth.users.email = admins.email
          WHERE auth.users.id = auth.uid()
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
        OR
        EXISTS (
          SELECT 1 FROM admins
          JOIN auth.users ON auth.users.email = admins.email
          WHERE auth.users.id = auth.uid()
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
        OR
        EXISTS (
          SELECT 1 FROM admins
          JOIN auth.users ON auth.users.email = admins.email
          WHERE auth.users.id = auth.uid()
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
        OR
        EXISTS (
          SELECT 1 FROM admins
          JOIN auth.users ON auth.users.email = admins.email
          WHERE auth.users.id = auth.uid()
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
        OR
        EXISTS (
          SELECT 1 FROM admins
          JOIN auth.users ON auth.users.email = admins.email
          WHERE auth.users.id = auth.uid()
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
    DROP POLICY IF EXISTS "Property owners can view their calendar events" ON property_calendar_events;
    DROP POLICY IF EXISTS "Property owners can insert calendar events" ON property_calendar_events;
    DROP POLICY IF EXISTS "Property owners can update calendar events" ON property_calendar_events;
    DROP POLICY IF EXISTS "Property owners can delete calendar events" ON property_calendar_events;

    -- Admins can view all calendar events (check both admins table and users.user_type)
    CREATE POLICY "Admins can view all calendar events"
      ON property_calendar_events FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.user_type = 'admin'
        )
        OR
        EXISTS (
          SELECT 1 FROM admins
          JOIN auth.users ON auth.users.email = admins.email
          WHERE auth.users.id = auth.uid()
        )
      );

    -- Admins can insert calendar events (check both admins table and users.user_type)
    CREATE POLICY "Admins can insert calendar events"
      ON property_calendar_events FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.user_type = 'admin'
        )
        OR
        EXISTS (
          SELECT 1 FROM admins
          JOIN auth.users ON auth.users.email = admins.email
          WHERE auth.users.id = auth.uid()
        )
      );

    -- Admins can update calendar events (check both admins table and users.user_type)
    CREATE POLICY "Admins can update calendar events"
      ON property_calendar_events FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.user_type = 'admin'
        )
        OR
        EXISTS (
          SELECT 1 FROM admins
          JOIN auth.users ON auth.users.email = admins.email
          WHERE auth.users.id = auth.uid()
        )
      );

    -- Admins can delete calendar events (check both admins table and users.user_type)
    CREATE POLICY "Admins can delete calendar events"
      ON property_calendar_events FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.user_type = 'admin'
        )
        OR
        EXISTS (
          SELECT 1 FROM admins
          JOIN auth.users ON auth.users.email = admins.email
          WHERE auth.users.id = auth.uid()
        )
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

    -- Only admins can insert/update/delete site settings (check both admins table and users.user_type)
    CREATE POLICY "Admins can manage site settings"
      ON site_settings FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.user_type = 'admin'
        )
        OR
        EXISTS (
          SELECT 1 FROM admins
          JOIN auth.users ON auth.users.email = admins.email
          WHERE auth.users.id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.user_type = 'admin'
        )
        OR
        EXISTS (
          SELECT 1 FROM admins
          JOIN auth.users ON auth.users.email = admins.email
          WHERE auth.users.id = auth.uid()
        )
      );
  END IF;
END $$;
