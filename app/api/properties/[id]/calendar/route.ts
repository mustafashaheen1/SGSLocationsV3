import { NextRequest, NextResponse } from 'next/server';
import { createServerSideClientWithToken } from '@/lib/supabase-server';
import { jsonResponseNoCache } from '@/lib/api-helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get access token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return jsonResponseNoCache({ error: 'Unauthorized - No token provided' }, { status: 401 });
    }

    const supabase = createServerSideClientWithToken(token);
    const propertyId = params.id;

    // Verify user is admin or property owner
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) {
      return jsonResponseNoCache({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userProfile } = await (supabase
      .from('users') as any)
      .select('user_type')
      .eq('id', user.id)
      .single();

    const isAdmin = userProfile?.user_type === 'admin';

    // Check if user owns this property
    const { data: property } = await (supabase
      .from('properties') as any)
      .select('owner_id')
      .eq('id', propertyId)
      .single();

    const isOwner = property?.owner_id === user.id;

    if (!isAdmin && !isOwner) {
      return jsonResponseNoCache({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all calendar events for this property
    const { data: events, error } = await (supabase
      .from('property_calendar_events') as any)
      .select('*')
      .eq('property_id', propertyId)
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Error fetching calendar events:', error);
      return jsonResponseNoCache({ error: error.message }, { status: 500 });
    }

    return jsonResponseNoCache({ events });
  } catch (error) {
    console.error('Error in GET /api/properties/[id]/calendar:', error);
    return jsonResponseNoCache(
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
      return jsonResponseNoCache({ error: 'Unauthorized - No token provided' }, { status: 401 });
    }

    const supabase = createServerSideClientWithToken(token);
    const propertyId = params.id;

    // Verify user is admin or property owner
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) {
      return jsonResponseNoCache({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    console.log('Calendar POST - User ID:', user.id, 'Email:', user.email);

    // Check if user is admin - check BOTH admins table and users.user_type
    const { directFetch } = await import('@/lib/supabase');

    // Check admins table
    const { data: adminData } = await directFetch('admins', {
      select: 'id',
      eq: { email: user.email || '' },
      single: true,
      authToken: token
    });

    // Check users table
    const { data: userProfile } = await (supabase
      .from('users') as any)
      .select('user_type')
      .eq('id', user.id)
      .single();

    const isAdmin = !!adminData || userProfile?.user_type === 'admin';
    console.log('Is admin (from admins table):', !!adminData);
    console.log('Is admin (from users.user_type):', userProfile?.user_type === 'admin');
    console.log('Is admin (final):', isAdmin);

    // Check if user owns this property
    const { data: property, error: propertyError } = await (supabase
      .from('properties') as any)
      .select('owner_id, status')
      .eq('id', propertyId)
      .single();

    console.log('Property:', property, 'Error:', propertyError);

    const isOwner = property?.owner_id === user.id;
    console.log('Is owner:', isOwner);

    if (!isAdmin && !isOwner) {
      console.log('Access denied - not admin and not owner');
      return jsonResponseNoCache({ error: 'Forbidden' }, { status: 403 });
    }

    // Property owners can only add events to approved/active properties
    // Admins can add events to any property
    if (!isAdmin && property?.status !== 'active') {
      return jsonResponseNoCache({
        error: 'Events can only be added to approved properties. Please wait for admin approval.'
      }, { status: 403 });
    }

    const body = await request.json();
    const { event_type, title, description, start_date, end_date, all_day, color } = body;

    // Validate required fields
    if (!event_type || !title || !start_date || !end_date) {
      return jsonResponseNoCache(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate event type
    const validTypes = ['hold_days', 'blackout_days', 'director_scout', 'tech_scout'];
    if (!validTypes.includes(event_type)) {
      return jsonResponseNoCache(
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
      return jsonResponseNoCache(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    // Check if start date is in the past
    if (startDate < today) {
      return jsonResponseNoCache(
        { error: 'Start date cannot be in the past' },
        { status: 400 }
      );
    }

    // Check if end date is in the past
    if (endDate < today) {
      return jsonResponseNoCache(
        { error: 'End date cannot be in the past' },
        { status: 400 }
      );
    }

    // Check if start date is after end date
    if (startDate > endDate) {
      return jsonResponseNoCache(
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
      return jsonResponseNoCache({ error: checkError.message }, { status: 500 });
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
      return jsonResponseNoCache(
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
      return jsonResponseNoCache({ error: error.message }, { status: 500 });
    }

    return jsonResponseNoCache({ event }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/properties/[id]/calendar:', error);
    return jsonResponseNoCache(
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
      return jsonResponseNoCache({ error: 'Unauthorized - No token provided' }, { status: 401 });
    }

    const supabase = createServerSideClientWithToken(token);
    const propertyId = params.id;

    // Verify user is admin or property owner
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) {
      return jsonResponseNoCache({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userProfile } = await (supabase
      .from('users') as any)
      .select('user_type')
      .eq('id', user.id)
      .single();

    const isAdmin = userProfile?.user_type === 'admin';

    // Check if user owns this property
    const { data: property } = await (supabase
      .from('properties') as any)
      .select('owner_id, status')
      .eq('id', propertyId)
      .single();

    const isOwner = property?.owner_id === user.id;

    if (!isAdmin && !isOwner) {
      return jsonResponseNoCache({ error: 'Forbidden' }, { status: 403 });
    }

    // Property owners can only modify events on approved/active properties
    // Admins can modify events on any property
    if (!isAdmin && property?.status !== 'active') {
      return jsonResponseNoCache({
        error: 'Events can only be modified on approved properties.'
      }, { status: 403 });
    }

    const body = await request.json();
    const { event_id, event_type, title, description, start_date, end_date, all_day, color } = body;

    if (!event_id) {
      return jsonResponseNoCache(
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
        return jsonResponseNoCache(
          { error: 'Invalid date format' },
          { status: 400 }
        );
      }

      // Check if start date is in the past
      if (startDate < today) {
        return jsonResponseNoCache(
          { error: 'Start date cannot be in the past' },
          { status: 400 }
        );
      }

      // Check if end date is in the past
      if (endDate < today) {
        return jsonResponseNoCache(
          { error: 'End date cannot be in the past' },
          { status: 400 }
        );
      }

      // Check if start date is after end date
      if (startDate > endDate) {
        return jsonResponseNoCache(
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
        return jsonResponseNoCache({ error: checkError.message }, { status: 500 });
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
        return jsonResponseNoCache(
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
      return jsonResponseNoCache({ error: error.message }, { status: 500 });
    }

    return jsonResponseNoCache({ event });
  } catch (error) {
    console.error('Error in PUT /api/properties/[id]/calendar:', error);
    return jsonResponseNoCache(
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
      return jsonResponseNoCache({ error: 'Unauthorized - No token provided' }, { status: 401 });
    }

    const supabase = createServerSideClientWithToken(token);
    const propertyId = params.id;

    // Verify user is admin or property owner
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) {
      return jsonResponseNoCache({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userProfile } = await (supabase
      .from('users') as any)
      .select('user_type')
      .eq('id', user.id)
      .single();

    const isAdmin = userProfile?.user_type === 'admin';

    // Check if user owns this property
    const { data: property } = await (supabase
      .from('properties') as any)
      .select('owner_id, status')
      .eq('id', propertyId)
      .single();

    const isOwner = property?.owner_id === user.id;

    if (!isAdmin && !isOwner) {
      return jsonResponseNoCache({ error: 'Forbidden' }, { status: 403 });
    }

    // Property owners can only delete events from approved/active properties
    // Admins can delete events from any property
    if (!isAdmin && property?.status !== 'active') {
      return jsonResponseNoCache({
        error: 'Events can only be deleted from approved properties.'
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('event_id');

    if (!eventId) {
      return jsonResponseNoCache(
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
      return jsonResponseNoCache({ error: error.message }, { status: 500 });
    }

    return jsonResponseNoCache({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/properties/[id]/calendar:', error);
    return jsonResponseNoCache(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
