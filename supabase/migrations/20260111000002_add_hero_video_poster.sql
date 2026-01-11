-- Migration: Add hero video poster support
-- Adds column to store poster/thumbnail image URL for hero section video

-- Add hero_video_poster column
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS hero_video_poster TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN site_settings.hero_video_poster IS
'URL to poster/thumbnail image displayed while hero video loads. Recommended: 1920x1080 JPG/WebP';
