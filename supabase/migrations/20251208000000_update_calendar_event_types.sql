-- Update calendar event types enum to add new values
-- Note: PostgreSQL doesn't support removing enum values easily, so we're adding new ones
-- The old values (production, blocked) will remain in the enum but won't be used by the application

-- Add new event types to the enum
ALTER TYPE calendar_event_type ADD VALUE IF NOT EXISTS 'hold_days';
ALTER TYPE calendar_event_type ADD VALUE IF NOT EXISTS 'blackout_days';
ALTER TYPE calendar_event_type ADD VALUE IF NOT EXISTS 'tech_scout';

-- Note: director_scout already exists and is still being used
-- The application code will now only use: hold_days, blackout_days, director_scout, tech_scout
