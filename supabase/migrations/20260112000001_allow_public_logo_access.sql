-- Allow public read access to site logo from app_settings table
-- This is safe because the logo is displayed on every public page anyway
CREATE POLICY "Allow public read access to site logo"
  ON app_settings
  FOR SELECT
  TO public
  USING (setting_key = 'site_logo_url');
