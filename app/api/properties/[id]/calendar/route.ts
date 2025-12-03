import { NextRequest, NextResponse } from 'next/server';
import { createServerSideClientWithToken } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get access token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
    }

    const supabase = createServerSideClientWithToken(token);
    const propertyId = params.id;

    // Verify user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    const { data: isAdmin } = await (supabase
      .from('admins') as any)
      .select('id')
      .eq('email', user.email)
      .single();

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all calendar events for this property
    const { data: events, error } = await (supabase
      .from('property_calendar_events') as any)
      .select('*')
      .eq('property_id', propertyId)
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Error fetching calendar events:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error in GET /api/properties/[id]/calendar:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get access token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
    }

    const supabase = createServerSideClientWithToken(token);
    const propertyId = params.id;

    // Verify user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    const { data: isAdmin } = await (supabase
      .from('admins') as any)
      .select('id')
      .eq('email', user.email)
      .single();

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { event_type, title, description, start_date, end_date, all_day, color } = body;

    // Validate required fields
    if (!event_type || !title || !start_date || !end_date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate event type
    const validTypes = ['production', 'director_scout', 'blocked'];
    if (!validTypes.includes(event_type)) {
      return NextResponse.json(
        { error: 'Invalid event type' },
        { status: 400 }
      );
    }

    // Date validations
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if dates are valid
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    // Check if start date is in the past
    if (startDate < today) {
      return NextResponse.json(
        { error: 'Start date cannot be in the past' },
        { status: 400 }
      );
    }

    // Check if end date is in the past
    if (endDate < today) {
      return NextResponse.json(
        { error: 'End date cannot be in the past' },
        { status: 400 }
      );
    }

    // Check if start date is after end date
    if (startDate > endDate) {
      return NextResponse.json(
        { error: 'Start date cannot be after end date' },
        { status: 400 }
      );
    }

    // Check for overlapping events
    const { data: existingEvents, error: checkError } = await (supabase
      .from('property_calendar_events') as any)
      .select('id, start_date, end_date')
      .eq('property_id', propertyId);

    if (checkError) {
      console.error('Error checking for overlaps:', checkError);
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }

    // Check if any existing event overlaps with the new date range
    const hasOverlap = existingEvents?.some((event: any) => {
      const eventStart = new Date(event.start_date);
      const eventEnd = new Date(event.end_date);

      return (
        (startDate >= eventStart && startDate <= eventEnd) ||
        (endDate >= eventStart && endDate <= eventEnd) ||
        (startDate <= eventStart && endDate >= eventEnd)
      );
    });

    if (hasOverlap) {
      return NextResponse.json(
        { error: 'This property already has an event during the selected dates' },
        { status: 409 }
      );
    }

    // Create the event
    const { data: event, error } = await (supabase
      .from('property_calendar_events') as any)
      .insert({
        property_id: propertyId,
        event_type,
        title,
        description: description || null,
        start_date,
        end_date,
        all_day: all_day || false,
        color: color || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating calendar event:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/properties/[id]/calendar:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get access token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
    }

    const supabase = createServerSideClientWithToken(token);

    // Verify user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    const { data: isAdmin } = await (supabase
      .from('admins') as any)
      .select('id')
      .eq('email', user.email)
      .single();

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { event_id, event_type, title, description, start_date, end_date, all_day, color } = body;

    if (!event_id) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    // If dates are being updated, validate them
    if (start_date || end_date) {
      // Get the current event to use existing dates if only one is being updated
      const { data: currentEvent } = await (supabase
        .from('property_calendar_events') as any)
        .select('start_date, end_date, property_id')
        .eq('id', event_id)
        .single();

      const startDate = new Date(start_date || currentEvent?.start_date);
      const endDate = new Date(end_date || currentEvent?.end_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if dates are valid
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format' },
          { status: 400 }
        );
      }

      // Check if start date is in the past
      if (startDate < today) {
        return NextResponse.json(
          { error: 'Start date cannot be in the past' },
          { status: 400 }
        );
      }

      // Check if end date is in the past
      if (endDate < today) {
        return NextResponse.json(
          { error: 'End date cannot be in the past' },
          { status: 400 }
        );
      }

      // Check if start date is after end date
      if (startDate > endDate) {
        return NextResponse.json(
          { error: 'Start date cannot be after end date' },
          { status: 400 }
        );
      }

      // Check for overlapping events (excluding the current event)
      const { data: existingEvents, error: checkError } = await (supabase
        .from('property_calendar_events') as any)
        .select('id, start_date, end_date')
        .eq('property_id', currentEvent?.property_id)
        .neq('id', event_id);

      if (checkError) {
        console.error('Error checking for overlaps:', checkError);
        return NextResponse.json({ error: checkError.message }, { status: 500 });
      }

      // Check if any existing event overlaps with the updated date range
      const hasOverlap = existingEvents?.some((event: any) => {
        const eventStart = new Date(event.start_date);
        const eventEnd = new Date(event.end_date);

        return (
          (startDate >= eventStart && startDate <= eventEnd) ||
          (endDate >= eventStart && endDate <= eventEnd) ||
          (startDate <= eventStart && endDate >= eventEnd)
        );
      });

      if (hasOverlap) {
        return NextResponse.json(
          { error: 'This property already has an event during the selected dates' },
          { status: 409 }
        );
      }
    }

    // Update the event
    const updateData: any = {};
    if (event_type !== undefined) updateData.event_type = event_type;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (start_date !== undefined) updateData.start_date = start_date;
    if (end_date !== undefined) updateData.end_date = end_date;
    if (all_day !== undefined) updateData.all_day = all_day;
    if (color !== undefined) updateData.color = color;

    const { data: event, error } = await (supabase
      .from('property_calendar_events') as any)
      .update(updateData)
      .eq('id', event_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating calendar event:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error('Error in PUT /api/properties/[id]/calendar:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get access token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
    }

    const supabase = createServerSideClientWithToken(token);

    // Verify user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    const { data: isAdmin } = await (supabase
      .from('admins') as any)
      .select('id')
      .eq('email', user.email)
      .single();

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('event_id');

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    const { error } = await (supabase
      .from('property_calendar_events') as any)
      .delete()
      .eq('id', eventId);

    if (error) {
      console.error('Error deleting calendar event:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/properties/[id]/calendar:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
