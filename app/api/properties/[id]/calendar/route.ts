import { NextRequest, NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSideClient();
    const propertyId = params.id;

    // Verify user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    const supabase = await createServerSideClient();
    const propertyId = params.id;

    // Verify user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    console.log('Calendar API - Auth check:', {
      hasUser: !!user,
      email: user?.email,
      authError: authError?.message
    });

    if (!user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized - No user session found' }, { status: 401 });
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
    const supabase = await createServerSideClient();

    // Verify user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    const supabase = await createServerSideClient();

    // Verify user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
