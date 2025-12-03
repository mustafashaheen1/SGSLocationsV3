# Property Calendar Feature - Setup Guide

## Overview
A calendar scheduling system has been added to the admin panel for managing property bookings, production shoots, director/scout visits, and blocked dates.

## Event Types
- **Production** - Full production shoots (Red)
- **Director/Scout** - Scouting or director preview sessions (Blue)
- **Blocked** - Unavailable dates for any reason (Gray)

## Database Migration Required

### Option 1: Supabase Dashboard (Recommended)
1. Log into your Supabase dashboard
2. Go to SQL Editor
3. Copy and paste the contents of:
   ```
   supabase/migrations/20251203034008_add_property_calendar_events.sql
   ```
4. Click "Run" to execute the migration

### Option 2: Supabase CLI (if linked)
```bash
npx supabase db push
```

## What Was Created

### 1. Database Table: `property_calendar_events`
```sql
Columns:
- id (UUID, Primary Key)
- property_id (UUID, Foreign Key to properties)
- event_type (enum: 'production' | 'director_scout' | 'blocked')
- title (VARCHAR 255, required)
- description (TEXT, optional)
- start_date (TIMESTAMP WITH TIME ZONE, required)
- end_date (TIMESTAMP WITH TIME ZONE, required)
- all_day (BOOLEAN, default false)
- color (VARCHAR 7, optional hex color)
- created_by (UUID, references auth.users)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP, auto-updates)
```

**Indexes:**
- `idx_calendar_events_property_id` - Fast property lookups
- `idx_calendar_events_dates` - Fast date range queries

**Security:**
- Row-Level Security (RLS) enabled
- Admins can create/read/update/delete all events
- Property owners can view their property's calendar events

### 2. API Endpoints
**Base URL:** `/api/properties/[id]/calendar`

#### GET - Fetch all events for a property
```typescript
GET /api/properties/[property_id]/calendar
Response: { events: PropertyCalendarEvent[] }
```

#### POST - Create new event
```typescript
POST /api/properties/[property_id]/calendar
Body: {
  event_type: 'production' | 'director_scout' | 'blocked',
  title: string,
  description?: string,
  start_date: string (ISO 8601),
  end_date: string (ISO 8601),
  all_day?: boolean,
  color?: string (hex)
}
Response: { event: PropertyCalendarEvent }
```

#### PUT - Update event
```typescript
PUT /api/properties/[property_id]/calendar
Body: {
  event_id: string,
  event_type?: string,
  title?: string,
  description?: string,
  start_date?: string,
  end_date?: string,
  all_day?: boolean,
  color?: string
}
Response: { event: PropertyCalendarEvent }
```

#### DELETE - Delete event
```typescript
DELETE /api/properties/[property_id]/calendar?event_id=[event_id]
Response: { success: true }
```

### 3. React Components

#### PropertyCalendar Component
**Location:** `components/PropertyCalendar.tsx`

**Features:**
- Interactive month/week/day views
- Click-and-drag to create events
- Click events to edit/delete
- Color-coded by event type
- Event legend
- Modal for event creation/editing

**Usage:**
```tsx
import PropertyCalendar from '@/components/PropertyCalendar';

<PropertyCalendar propertyId={propertyId} />
```

### 4. Admin Panel Integration

The property edit page now has 4 tabs:
1. **Property Details** - Basic info, address, category
2. **Images & Tags** - Image management and tagging
3. **Calendar** - NEW! Event scheduling
4. **Contacts & Notes** - Contact info and admin notes

**Location:** `app/admin/properties/[id]/edit/page.tsx`

## How to Use

### Creating an Event
1. Navigate to Admin Panel > Properties
2. Select a property to edit
3. Click the "Calendar" tab
4. Click and drag on the calendar to select a date range
5. Fill in event details:
   - Event type (Production/Director-Scout/Blocked)
   - Title (required)
   - Description (optional)
   - Start/End dates
   - All-day checkbox
6. Click "Create"

### Editing an Event
1. Click on an existing event in the calendar
2. Modify the details in the modal
3. Click "Update"

### Deleting an Event
1. Click on the event
2. Click "Delete" button in the modal
3. Confirm deletion

## Dependencies Installed

```json
{
  "react-big-calendar": "latest",
  "date-fns": "^3.6.0" (already installed)
}
```

## Files Modified

1. `supabase/migrations/20251203034008_add_property_calendar_events.sql` - NEW
2. `lib/supabase.ts` - Added CalendarEventType and PropertyCalendarEvent types
3. `app/api/properties/[id]/calendar/route.ts` - NEW API endpoints
4. `components/PropertyCalendar.tsx` - NEW Calendar component
5. `app/admin/properties/[id]/edit/page.tsx` - Added tab interface and calendar tab
6. `app/globals.css` - Added React Big Calendar CSS import

## TypeScript Types

```typescript
export type CalendarEventType = 'production' | 'director_scout' | 'blocked';

export interface PropertyCalendarEvent {
  id: string;
  property_id: string;
  event_type: CalendarEventType;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  all_day: boolean;
  color: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
```

## Color Scheme

The calendar uses your brand colors:
- **Production:** `#e11921` (Brand Red)
- **Director/Scout:** `#3b82f6` (Blue)
- **Blocked:** `#6b7280` (Gray)

## Security Notes

- All API endpoints require admin authentication
- Uses Row-Level Security (RLS) policies
- Admin verification checks against `admins` table by email
- Events are scoped per property
- Property owners can view (but not edit) their property's calendar

## Future Enhancements (Optional)

- Email notifications for new bookings
- Conflict detection for overlapping events
- Recurring events
- Calendar export (iCal format)
- Public availability calendar for property owners
- Integration with external booking systems

## Troubleshooting

### Migration fails
- Check that the `properties` table exists
- Verify the `admins` table has an `email` column
- Ensure you have admin privileges in Supabase

### Events not appearing
- Check browser console for API errors
- Verify you're logged in as an admin
- Check RLS policies in Supabase dashboard

### Calendar styling issues
- Ensure `app/globals.css` includes the React Big Calendar import
- Clear browser cache
- Check for CSS conflicts with Tailwind

## Support

For issues or questions, refer to:
- React Big Calendar docs: https://jquense.github.io/react-big-calendar
- Supabase RLS docs: https://supabase.com/docs/guides/auth/row-level-security
