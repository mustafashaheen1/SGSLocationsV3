-- Run this script to update existing categories to show in location library by default
UPDATE categories
SET show_in_location_library = true
WHERE parent_id IS NOT NULL;
