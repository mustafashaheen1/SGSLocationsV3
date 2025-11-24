-- Fix RLS policies for about_page_content table
-- This allows admins to insert, update, and delete content

-- First, enable RLS if not already enabled
ALTER TABLE about_page_content ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow public read access to about_page_content" ON about_page_content;
DROP POLICY IF EXISTS "Allow admins to insert about_page_content" ON about_page_content;
DROP POLICY IF EXISTS "Allow admins to update about_page_content" ON about_page_content;
DROP POLICY IF EXISTS "Allow admins to delete about_page_content" ON about_page_content;

-- Allow anyone to read (public access)
CREATE POLICY "Allow public read access to about_page_content"
ON about_page_content
FOR SELECT
TO public
USING (true);

-- Allow authenticated admins to insert
CREATE POLICY "Allow admins to insert about_page_content"
ON about_page_content
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.email = auth.jwt() ->> 'email'
    AND admins.is_active = true
  )
);

-- Allow authenticated admins to update
CREATE POLICY "Allow admins to update about_page_content"
ON about_page_content
FOR UPDATE
TO authenticated
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

-- Allow authenticated admins to delete
CREATE POLICY "Allow admins to delete about_page_content"
ON about_page_content
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.email = auth.jwt() ->> 'email'
    AND admins.is_active = true
  )
);
