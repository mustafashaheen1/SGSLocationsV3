-- Create table for managing form questions
CREATE TABLE IF NOT EXISTS form_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_name TEXT NOT NULL, -- 'list_your_property'
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL, -- 'radio', 'checkbox', 'text'
  is_required BOOLEAN DEFAULT true,
  display_order INTEGER NOT NULL,
  options JSONB, -- Array of options for radio/checkbox questions
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_form_questions_form_name ON form_questions(form_name);
CREATE INDEX idx_form_questions_display_order ON form_questions(display_order);

-- Insert default questions for list_your_property form
INSERT INTO form_questions (form_name, question_text, question_type, is_required, display_order, options) VALUES
(
  'list_your_property',
  'Is this location listed on any other location platforms such as Airbnb or Peerspace?',
  'radio',
  true,
  1,
  '["Yes", "No"]'::jsonb
),
(
  'list_your_property',
  'Are you currently:',
  'radio',
  true,
  2,
  '["Property Owner", "Property Manager", "Other"]'::jsonb
),
(
  'list_your_property',
  'Is this location currently listed for sale?',
  'radio',
  true,
  3,
  '["Yes", "No"]'::jsonb
),
(
  'list_your_property',
  'I request that my property be considered for location and event use as follows: (check all that apply)',
  'checkbox',
  true,
  4,
  '["Still & Print Photography", "TV & Motion Pictures", "Corporate Events", "Long or Short Term Lease"]'::jsonb
),
(
  'list_your_property',
  'I request that my property be listed with: (check all that apply)',
  'checkbox',
  true,
  5,
  '["SGS Locations", "Wedding Estates (Wedding Photography)", "FilmHere.com (Student Films)"]'::jsonb
),
(
  'list_your_property',
  'How did you hear about us?',
  'checkbox',
  true,
  6,
  '["Online Search", "Currently Listed Property Owner", "Production Referral", "Other"]'::jsonb
);

-- Enable RLS
ALTER TABLE form_questions ENABLE ROW LEVEL SECURITY;

-- Policy for public to read questions
CREATE POLICY "Anyone can read form questions"
  ON form_questions FOR SELECT
  USING (true);

-- Policy for admins to manage questions
CREATE POLICY "Admins can manage form questions"
  ON form_questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.user_type = 'admin'
    )
  );
