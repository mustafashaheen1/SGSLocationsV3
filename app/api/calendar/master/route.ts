import { NextRequest, NextResponse } from 'next/server';
import { createServerSideClientWithToken } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
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

    // Fetch all calendar events from all properties
    const { data: events, error: eventsError } = await (supabase
      .from('property_calendar_events') as any)
      .select(`
        *,
        properties!inner (
          id,
          name,
          real_name,
          city,
          county
        )
      `)
      .order('start_date', { ascending: true });

    if (eventsError) {
      console.error('Error fetching calendar events:', eventsError);
      return NextResponse.json({ error: eventsError.message }, { status: 500 });
    }

    // Transform the data to include property info at the top level
    const transformedEvents = events?.map((event: any) => ({
      id: event.id,
      property_id: event.property_id,
      property_name: event.properties.real_name || event.properties.name,
      property_display_name: event.properties.name,
      property_city: event.properties.city,
      property_state: event.properties.county,
      event_type: event.event_type,
      title: event.title,
      description: event.description,
      start_date: event.start_date,
      end_date: event.end_date,
      all_day: event.all_day,
      color: event.color,
      created_at: event.created_at,
      created_by: event.created_by,
    })) || [];

    return NextResponse.json({ events: transformedEvents });
  } catch (error) {
    console.error('Error in GET /api/calendar/master:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
