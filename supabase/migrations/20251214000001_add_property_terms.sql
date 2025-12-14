-- Add terms and conditions fields to properties table
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS terms_type TEXT CHECK (terms_type IN ('text', 'pdf')),
ADD COLUMN IF NOT EXISTS terms_content TEXT,
ADD COLUMN IF NOT EXISTS terms_pdf_url TEXT,
ADD COLUMN IF NOT EXISTS terms_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS terms_sent_by TEXT;

-- Add comment
COMMENT ON COLUMN properties.terms_type IS 'Type of terms and conditions: text or pdf';
COMMENT ON COLUMN properties.terms_content IS 'Text content of terms and conditions';
COMMENT ON COLUMN properties.terms_pdf_url IS 'S3 URL of PDF terms and conditions';
COMMENT ON COLUMN properties.terms_sent_at IS 'When terms and conditions were sent to property owner';
COMMENT ON COLUMN properties.terms_sent_by IS 'Admin user ID who sent the terms and conditions';
