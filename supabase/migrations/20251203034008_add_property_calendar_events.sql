-- Create enum for event types
CREATE TYPE calendar_event_type AS ENUM ('production', 'director_scout', 'blocked');

-- Create property_calendar_events table
CREATE TABLE property_calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  event_type calendar_event_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  all_day BOOLEAN DEFAULT false,
  color VARCHAR(7),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Create index for faster property lookups
CREATE INDEX idx_calendar_events_property_id ON property_calendar_events(property_id);
CREATE INDEX idx_calendar_events_dates ON property_calendar_events(start_date, end_date);

-- Enable RLS
ALTER TABLE property_calendar_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admins can do everything
CREATE POLICY "Admins can view all calendar events"
  ON property_calendar_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.email = auth.email()
    )
  );

CREATE POLICY "Admins can insert calendar events"
  ON property_calendar_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.email = auth.email()
    )
  );

CREATE POLICY "Admins can update calendar events"
  ON property_calendar_events FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.email = auth.email()
    )
  );

CREATE POLICY "Admins can delete calendar events"
  ON property_calendar_events FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.email = auth.email()
    )
  );

-- Property owners can view their property's calendar
CREATE POLICY "Property owners can view their calendar events"
  ON property_calendar_events FOR SELECT
  USING (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_property_calendar_events_updated_at BEFORE UPDATE
  ON property_calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
