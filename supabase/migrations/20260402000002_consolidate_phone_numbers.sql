-- Remove redundant phone number keys; contact_phone is the single source of truth
DELETE FROM site_settings WHERE key IN ('general_contact_phone', 'property_footer_phone');
