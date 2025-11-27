-- Add banned status to users table
-- This allows admins to ban users from logging in

ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_banned boolean DEFAULT false;

COMMENT ON COLUMN users.is_banned IS 'Whether the user is banned from logging in. Banned users will receive an error message directing them to support.';

-- Create index for faster lookups during login
CREATE INDEX IF NOT EXISTS idx_users_is_banned ON users(is_banned) WHERE is_banned = true;

-- Update RLS policies to allow admins to update banned status
-- (Admins should already have full access to users table)
