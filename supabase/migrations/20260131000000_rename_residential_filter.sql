-- Migration: Rename Residential filter to Residential Style
-- Created: 2026-01-31
-- Purpose: Update the display name of the Residential search filter

UPDATE search_filters
SET name = 'Residential Style'
WHERE slug = 'residential';
