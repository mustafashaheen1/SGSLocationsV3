-- Change documents table to associate with properties instead of production companies

-- First, check if documents table exists, if not create it
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  document_type VARCHAR(50) NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- If table already exists with production_company_id, we need to alter it
-- Drop the old foreign key constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'production_company_id'
  ) THEN
    -- Drop the old column
    ALTER TABLE documents DROP COLUMN IF EXISTS production_company_id;

    -- Add the new property_id column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'documents' AND column_name = 'property_id'
    ) THEN
      ALTER TABLE documents ADD COLUMN property_id UUID REFERENCES properties(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_property_id ON documents(property_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_document_type ON documents(document_type);

-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Admins can view all documents" ON documents;
DROP POLICY IF EXISTS "Admins can insert documents" ON documents;
DROP POLICY IF EXISTS "Admins can update documents" ON documents;
DROP POLICY IF EXISTS "Admins can delete documents" ON documents;
DROP POLICY IF EXISTS "Property owners can view their documents" ON documents;

-- RLS Policies
-- Admins can do everything
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

-- Property owners can view their property's documents
CREATE POLICY "Property owners can view their documents"
  ON documents FOR SELECT
  USING (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_documents_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_documents_updated_at_column();
