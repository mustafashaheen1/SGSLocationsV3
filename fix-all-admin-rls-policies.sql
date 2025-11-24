-- Comprehensive RLS Policy Fix for All Admin-Managed Tables
-- Run this in Supabase SQL Editor to fix all RLS permission issues

-- ============================================
-- 1. SITE SETTINGS TABLE
-- ============================================
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to site_settings" ON site_settings;
DROP POLICY IF EXISTS "Allow admins to manage site_settings" ON site_settings;

CREATE POLICY "Allow public read access to site_settings"
ON site_settings FOR SELECT TO public USING (true);

CREATE POLICY "Allow admins to manage site_settings"
ON site_settings FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.email = auth.jwt() ->> 'email'
    AND admins.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.email = auth.jwt() ->> 'email'
    AND admins.is_active = true
  )
);

-- ============================================
-- 2. ABOUT PAGE CONTENT TABLE
-- ============================================
ALTER TABLE about_page_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to about_page_content" ON about_page_content;
DROP POLICY IF EXISTS "Allow admins to manage about_page_content" ON about_page_content;

CREATE POLICY "Allow public read access to about_page_content"
ON about_page_content FOR SELECT TO public USING (true);

CREATE POLICY "Allow admins to manage about_page_content"
ON about_page_content FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.email = auth.jwt() ->> 'email'
    AND admins.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.email = auth.jwt() ->> 'email'
    AND admins.is_active = true
  )
);

-- ============================================
-- 3. PRODUCTION LOGOS TABLE
-- ============================================
ALTER TABLE production_logos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to production_logos" ON production_logos;
DROP POLICY IF EXISTS "Allow admins to manage production_logos" ON production_logos;

CREATE POLICY "Allow public read access to production_logos"
ON production_logos FOR SELECT TO public USING (true);

CREATE POLICY "Allow admins to manage production_logos"
ON production_logos FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.email = auth.jwt() ->> 'email'
    AND admins.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.email = auth.jwt() ->> 'email'
    AND admins.is_active = true
  )
);

-- ============================================
-- 4. SERVICES TABLE
-- ============================================
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to services" ON services;
DROP POLICY IF EXISTS "Allow admins to manage services" ON services;

CREATE POLICY "Allow public read access to services"
ON services FOR SELECT TO public USING (true);

CREATE POLICY "Allow admins to manage services"
ON services FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.email = auth.jwt() ->> 'email'
    AND admins.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.email = auth.jwt() ->> 'email'
    AND admins.is_active = true
  )
);

-- ============================================
-- 5. SOCIAL LINKS TABLE
-- ============================================
ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to social_links" ON social_links;
DROP POLICY IF EXISTS "Allow admins to manage social_links" ON social_links;

CREATE POLICY "Allow public read access to social_links"
ON social_links FOR SELECT TO public USING (true);

CREATE POLICY "Allow admins to manage social_links"
ON social_links FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.email = auth.jwt() ->> 'email'
    AND admins.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.email = auth.jwt() ->> 'email'
    AND admins.is_active = true
  )
);

-- ============================================
-- 6. CONTACT GRID TABLE
-- ============================================
ALTER TABLE contact_grid ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to contact_grid" ON contact_grid;
DROP POLICY IF EXISTS "Allow admins to manage contact_grid" ON contact_grid;

CREATE POLICY "Allow public read access to contact_grid"
ON contact_grid FOR SELECT TO public USING (true);

CREATE POLICY "Allow admins to manage contact_grid"
ON contact_grid FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.email = auth.jwt() ->> 'email'
    AND admins.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.email = auth.jwt() ->> 'email'
    AND admins.is_active = true
  )
);

-- ============================================
-- 7. TERMS AND CONDITIONS TABLE
-- ============================================
ALTER TABLE terms_and_conditions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to terms_and_conditions" ON terms_and_conditions;
DROP POLICY IF EXISTS "Allow admins to manage terms_and_conditions" ON terms_and_conditions;

CREATE POLICY "Allow public read access to terms_and_conditions"
ON terms_and_conditions FOR SELECT TO public USING (is_active = true);

CREATE POLICY "Allow admins to manage terms_and_conditions"
ON terms_and_conditions FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.email = auth.jwt() ->> 'email'
    AND admins.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.email = auth.jwt() ->> 'email'
    AND admins.is_active = true
  )
);

-- ============================================
-- 8. CATEGORIES TABLE
-- ============================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to categories" ON categories;
DROP POLICY IF EXISTS "Allow admins to manage categories" ON categories;

CREATE POLICY "Allow public read access to categories"
ON categories FOR SELECT TO public USING (true);

CREATE POLICY "Allow admins to manage categories"
ON categories FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.email = auth.jwt() ->> 'email'
    AND admins.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.email = auth.jwt() ->> 'email'
    AND admins.is_active = true
  )
);

-- Success message
SELECT 'All RLS policies have been updated successfully!' as status;
