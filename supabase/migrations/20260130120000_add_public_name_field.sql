-- Migration: Add public_name field to properties table
-- Created: 2026-01-30
-- Purpose: Add public display name field for AI-generated property names (max 30 characters)

-- Add public_name column to properties table
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS public_name VARCHAR(30);

-- Add comment explaining the field
COMMENT ON COLUMN properties.public_name IS 'AI-generated public display name for the property (max 30 characters). Shown on website instead of internal code.';

-- Add index for search performance
CREATE INDEX IF NOT EXISTS idx_properties_public_name ON properties(public_name);
