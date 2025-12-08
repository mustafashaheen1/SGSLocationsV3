-- Create property_projects table for organizing documents into project folders

CREATE TABLE IF NOT EXISTS property_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_property_projects_property_id ON property_projects(property_id);
CREATE INDEX IF NOT EXISTS idx_property_projects_created_at ON property_projects(created_at DESC);

-- Enable RLS
ALTER TABLE property_projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for property_projects
-- Admins can do everything
CREATE POLICY "Admins can view all projects"
  ON property_projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.email = auth.email()
    )
  );

CREATE POLICY "Admins can insert projects"
  ON property_projects FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.email = auth.email()
    )
  );

CREATE POLICY "Admins can update projects"
  ON property_projects FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.email = auth.email()
    )
  );

CREATE POLICY "Admins can delete projects"
  ON property_projects FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.email = auth.email()
    )
  );

-- Property owners can view their property's projects
CREATE POLICY "Property owners can view their projects"
  ON property_projects FOR SELECT
  USING (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );

-- Property owners can create projects for their properties
CREATE POLICY "Property owners can insert projects"
  ON property_projects FOR INSERT
  WITH CHECK (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );

-- Property owners can update their property's projects
CREATE POLICY "Property owners can update their projects"
  ON property_projects FOR UPDATE
  USING (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );

-- Property owners can delete their property's projects
CREATE POLICY "Property owners can delete their projects"
  ON property_projects FOR DELETE
  USING (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );

-- Update trigger for property_projects
CREATE OR REPLACE FUNCTION update_property_projects_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_property_projects_updated_at ON property_projects;
CREATE TRIGGER update_property_projects_updated_at
  BEFORE UPDATE ON property_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_property_projects_updated_at_column();

-- Now update documents table to reference projects instead of properties
-- IMPORTANT: Drop RLS policies FIRST before dropping columns they depend on
DROP POLICY IF EXISTS "Admins can view all documents" ON documents;
DROP POLICY IF EXISTS "Admins can insert documents" ON documents;
DROP POLICY IF EXISTS "Admins can update documents" ON documents;
DROP POLICY IF EXISTS "Admins can delete documents" ON documents;
DROP POLICY IF EXISTS "Property owners can view their documents" ON documents;
DROP POLICY IF EXISTS "Property owners can insert documents" ON documents;
DROP POLICY IF EXISTS "Property owners can delete documents" ON documents;

-- Update document indexes
DROP INDEX IF EXISTS idx_documents_property_id;

-- Now we can safely modify the columns
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'property_id'
  ) THEN
    -- Drop the property_id column
    ALTER TABLE documents DROP COLUMN IF EXISTS property_id;
  END IF;

  -- Add project_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE documents ADD COLUMN project_id UUID REFERENCES property_projects(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create new index for project_id
CREATE INDEX IF NOT EXISTS idx_documents_project_id ON documents(project_id);

-- Admins can do everything with documents
CREATE POLICY "Admins can view all documents"
  ON documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.email = auth.email()
    )
  );

CREATE POLICY "Admins can insert documents"
  ON documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.email = auth.email()
    )
  );

CREATE POLICY "Admins can update documents"
  ON documents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.email = auth.email()
    )
  );

CREATE POLICY "Admins can delete documents"
  ON documents FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.email = auth.email()
    )
  );

-- Property owners can view documents in their property's projects
CREATE POLICY "Property owners can view their project documents"
  ON documents FOR SELECT
  USING (
    project_id IN (
      SELECT pp.id FROM property_projects pp
      JOIN properties p ON p.id = pp.property_id
      WHERE p.owner_id = auth.uid()
    )
  );

-- Property owners can insert documents into their property's projects
CREATE POLICY "Property owners can insert project documents"
  ON documents FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT pp.id FROM property_projects pp
      JOIN properties p ON p.id = pp.property_id
      WHERE p.owner_id = auth.uid()
    )
  );

-- Property owners can delete documents from their property's projects
CREATE POLICY "Property owners can delete project documents"
  ON documents FOR DELETE
  USING (
    project_id IN (
      SELECT pp.id FROM property_projects pp
      JOIN properties p ON p.id = pp.property_id
      WHERE p.owner_id = auth.uid()
    )
  );
