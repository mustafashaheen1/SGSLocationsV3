-- ============================================
-- PRODUCTION COMPANIES & DOCUMENTS SCHEMA
-- ============================================

-- 1. Create production_companies table
CREATE TABLE IF NOT EXISTS production_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  website VARCHAR(255),
  notes TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_company_id UUID NOT NULL REFERENCES production_companies(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT, -- Size in bytes
  file_type VARCHAR(100), -- PDF, DOC, DOCX, etc.
  uploaded_by VARCHAR(255), -- Admin email who uploaded it
  document_type VARCHAR(100), -- Contract, Agreement, Invoice, etc.
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_documents_company_id ON documents(production_company_id);
CREATE INDEX IF NOT EXISTS idx_documents_title ON documents(title);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);
CREATE INDEX IF NOT EXISTS idx_production_companies_name ON production_companies(name);
CREATE INDEX IF NOT EXISTS idx_production_companies_is_active ON production_companies(is_active);

-- 4. Add RLS (Row Level Security) policies
ALTER TABLE production_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public read access to production_companies" ON production_companies;
DROP POLICY IF EXISTS "Allow admins to manage production_companies" ON production_companies;
DROP POLICY IF EXISTS "Allow public read access to documents" ON documents;
DROP POLICY IF EXISTS "Allow admins to manage documents" ON documents;

-- Allow public to read active production companies
CREATE POLICY "Allow public read access to production_companies"
ON production_companies FOR SELECT TO public
USING (is_active = true);

-- Allow admins full access to production companies
CREATE POLICY "Allow admins to manage production_companies"
ON production_companies FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.email = auth.jwt() ->> 'email'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.email = auth.jwt() ->> 'email'
  )
);

-- Allow public to read active documents
CREATE POLICY "Allow public read access to documents"
ON documents FOR SELECT TO public
USING (is_active = true);

-- Allow admins full access to documents
CREATE POLICY "Allow admins to manage documents"
ON documents FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.email = auth.jwt() ->> 'email'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.email = auth.jwt() ->> 'email'
  )
);

-- 5. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Create triggers for auto-updating timestamps
DROP TRIGGER IF EXISTS update_production_companies_updated_at ON production_companies;
CREATE TRIGGER update_production_companies_updated_at
  BEFORE UPDATE ON production_companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. Insert sample data (optional - for testing)
-- You can comment this out if you don't want sample data
INSERT INTO production_companies (name, contact_person, email, phone, address, website, notes)
VALUES
  ('Paramount Pictures', 'John Smith', 'john@paramount.com', '(310) 555-0100', '5555 Melrose Ave, Los Angeles, CA 90038', 'https://www.paramount.com', 'Major film studio'),
  ('Warner Bros.', 'Jane Doe', 'jane@warnerbros.com', '(818) 555-0200', '4000 Warner Blvd, Burbank, CA 91522', 'https://www.warnerbros.com', 'Film and television production'),
  ('Netflix Studios', 'Mike Johnson', 'mike@netflix.com', '(408) 555-0300', '100 Winchester Circle, Los Gatos, CA 95032', 'https://www.netflix.com', 'Streaming and production company')
ON CONFLICT DO NOTHING;

-- Success message
SELECT 'Production Companies & Documents schema created successfully!' as status;
