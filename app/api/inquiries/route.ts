import { createServerSideClient, createServerSideClientWithToken } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Try cookie-based auth first (better for RLS policies)
    const supabase = await createServerSideClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // If cookie auth fails, try token-based auth
    if (authError || !user) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const tokenSupabase = createServerSideClientWithToken(token);
        const { data: { user: tokenUser }, error: tokenError } = await tokenSupabase.auth.getUser();

        if (tokenError || !tokenUser) {
          return NextResponse.json(
            { error: 'Authentication required. Please log in to submit an inquiry.' },
            { status: 401 }
          );
        }

        // Use token-based client and user for the rest of the request
        return handleInquiryInsert(request, tokenSupabase, tokenUser);
      }

      return NextResponse.json(
        { error: 'Authentication required. Please log in to submit an inquiry.' },
        { status: 401 }
      );
    }

    return handleInquiryInsert(request, supabase, user);
  } catch (error: any) {
    console.error('Inquiry API error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleInquiryInsert(request: NextRequest, supabase: any, user: any) {
  try {

    // Parse request body
    const body = await request.json();
    const {
      property_id,
      first_name,
      last_name,
      email,
      company,
      phone,
      message,
      crew_size,
      locations,
      shooting_date,
      project_type,
      how_did_you_hear
    } = body;

    // Validate required fields
    if (!first_name || !last_name || !email || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: firstName, lastName, email, and message are required.' },
        { status: 400 }
      );
    }

    // Prepare inquiry data
    const inquiryData = {
      property_id: property_id || null,
      user_id: user.id,
      user_name: `${first_name} ${last_name}`,
      user_email: email,
      user_phone: phone || null,
      first_name,
      last_name,
      company: company || null,
      message,
      crew_size: crew_size ? parseInt(crew_size) : null,
      locations: locations || null,
      shooting_date: shooting_date || null,
      project_type: project_type || null,
      how_did_you_hear: how_did_you_hear || null,
      status: 'new'
    };

    console.log('Attempting to insert inquiry:', JSON.stringify(inquiryData, null, 2));

    // Insert inquiry (without select to avoid policy check issues)
    const { error: insertError } = await supabase
      .from('inquiries')
      .insert(inquiryData);

    if (insertError) {
      console.error('Error creating inquiry:', insertError);
      console.error('Insert error details:', JSON.stringify(insertError, null, 2));
      return NextResponse.json(
        { error: insertError.message || 'Failed to create inquiry. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Inquiry submitted successfully' }, { status: 201 });

  } catch (error: any) {
    console.error('Inquiry API error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSideClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: adminCheck } = await supabase
      .from('admins')
      .select('id')
      .eq('email', user.email)
      .maybeSingle();

    const isAdmin = !!adminCheck;

    // Get user type for non-admins
    let userType = null;
    if (!isAdmin) {
      const { data: userData } = await supabase
        .from('users')
        .select('user_type')
        .eq('id', user.id)
        .single();
      userType = userData?.user_type;
    }

    // Get property_id filter from query params
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('property_id');

    let query = supabase
      .from('inquiries')
      .select(`
        *,
        properties (
          id,
          name,
          address,
          city,
          county,
          primary_image
        )
      `)
      .order('created_at', { ascending: false });

    // Apply property filter if provided
    if (propertyId) {
      query = query.eq('property_id', propertyId);
    } else {
      // Apply role-based filters only if not filtering by specific property
      if (isAdmin) {
        // Admins see all inquiries
      } else if (userType === 'property_owner') {
        // Property owners see their own inquiries + inquiries for their properties
        const { data: ownedProperties } = await supabase
          .from('properties')
          .select('id')
          .eq('owner_id', user.id);

        const propertyIds = (ownedProperties || []).map((p: any) => p.id);

        if (propertyIds.length > 0) {
          // Use OR condition: their inquiries OR inquiries for their properties
          query = query.or(`user_id.eq.${user.id},property_id.in.(${propertyIds.join(',')})`);
        } else {
          // No properties, just show their own inquiries
          query = query.eq('user_id', user.id);
        }
      } else {
        // Producers see only their own inquiries
        query = query.eq('user_id', user.id);
      }
    }

    const { data: inquiries, error } = await query;

    if (error) {
      console.error('Error fetching inquiries:', error);
      return NextResponse.json(
        { error: 'Failed to fetch inquiries' },
        { status: 500 }
      );
    }

    return NextResponse.json({ inquiries: inquiries || [] });

  } catch (error: any) {
    console.error('Inquiry fetch API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
