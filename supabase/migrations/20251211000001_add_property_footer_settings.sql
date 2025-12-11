-- Add property footer settings to site_settings table
-- These settings control the content displayed at the bottom of property detail pages

INSERT INTO site_settings (key, value, page, section) VALUES
  ('property_footer_phone', '"(310) 871-8004"', 'property', 'footer'),
  ('property_footer_partner_text', '"American Express Preferred Partner"', 'property', 'footer'),
  ('property_footer_license', '"CalDRE #01234567"', 'property', 'footer'),
  ('property_footer_company_name', '"Image Locations"', 'property', 'footer')
ON CONFLICT (key) DO NOTHING;
