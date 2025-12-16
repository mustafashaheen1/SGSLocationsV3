import { createServerSideClient, createServerSideClientWithToken } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import { jsonResponseNoCache } from '@/lib/api-helpers';
import { verifyRecaptcha } from '@/lib/recaptcha';

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
          return jsonResponseNoCache(
            { error: 'Authentication required. Please log in to submit an inquiry.' },
            { status: 401 }
          );
        }

        // Use token-based client and user for the rest of the request
        return handleInquiryInsert(request, tokenSupabase, tokenUser);
      }

      return jsonResponseNoCache(
        { error: 'Authentication required. Please log in to submit an inquiry.' },
        { status: 401 }
      );
    }

    return handleInquiryInsert(request, supabase, user);
  } catch (error: any) {
    console.error('Inquiry API error:', error);
    console.error('Error stack:', error.stack);
    return jsonResponseNoCache(
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
      how_did_you_hear,
      recaptcha_token
    } = body;

    // Verify reCAPTCHA token
    const recaptchaResult = await verifyRecaptcha(recaptcha_token);
    if (!recaptchaResult.success) {
      return jsonResponseNoCache(
        { error: recaptchaResult.error || 'reCAPTCHA verification failed' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!first_name || !last_name || !email || !message) {
      return jsonResponseNoCache(
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
      return jsonResponseNoCache(
        { error: insertError.message || 'Failed to create inquiry. Please try again.' },
        { status: 500 }
      );
    }

    // Send confirmation email to the user
    try {
      // Get property details if inquiry is for a specific property
      let propertyName = null;
      let propertyAddress = null;

      if (property_id) {
        const { data: propertyData } = await supabase
          .from('properties')
          .select('name, address, city, county')
          .eq('id', property_id)
          .single();

        if (propertyData) {
          propertyName = propertyData.name;
          propertyAddress = `${propertyData.address}, ${propertyData.city}, ${propertyData.county || ''}`.trim();
        }
      }

      await fetch(`${request.nextUrl.origin}/api/send-inquiry-confirmation-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          name: `${first_name} ${last_name}`,
          propertyName: propertyName,
          propertyAddress: propertyAddress
        })
      });
    } catch (emailError) {
      console.error('Failed to send inquiry confirmation email:', emailError);
      // Don't block the inquiry submission if email fails
    }

    return jsonResponseNoCache({ success: true, message: 'Inquiry submitted successfully' }, { status: 201 });

  } catch (error: any) {
    console.error('Inquiry API error:', error);
    console.error('Error stack:', error.stack);
    return jsonResponseNoCache(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Try cookie-based auth first
    const supabase = await createServerSideClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // If cookie auth fails, try token-based auth
    if (authError || !user) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const tokenSupabase = createServerSideClientWithToken(token);
        const { data: { user: tokenUser }, error: tokenError } = await tokenSupabase.auth.getUser();

        if (tokenError || !tokenUser) {
          console.error('GET /api/inquiries - Auth error (both cookie and token failed)');
          return jsonResponseNoCache(
            { error: 'Authentication required' },
            { status: 401 }
          );
        }

        // Use token-based client and user for the rest of the request
        return handleInquiriesFetch(request, tokenSupabase, tokenUser);
      }

      console.error('GET /api/inquiries - Auth error:', authError);
      return jsonResponseNoCache(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('GET /api/inquiries - User ID:', user.id);
    return handleInquiriesFetch(request, supabase, user);
  } catch (error: any) {
    console.error('Inquiry fetch API error:', error);
    return jsonResponseNoCache(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleInquiriesFetch(request: NextRequest, supabase: any, user: any) {
  try {
    console.log('handleInquiriesFetch - User ID:', user.id);

    const { data: adminCheck } = await supabase
      .from('admins')
      .select('id')
      .eq('email', user.email)
      .maybeSingle();

    const isAdmin = !!adminCheck;
    console.log('handleInquiriesFetch - Is Admin:', isAdmin);

    // Get user type for non-admins
    let userType = null;
    if (!isAdmin) {
      const { data: userData } = await supabase
        .from('users')
        .select('user_type')
        .eq('id', user.id)
        .single();
      userType = userData?.user_type;
      console.log('handleInquiriesFetch - User Type:', userType);
    }

    // Get property_id filter from query params
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('property_id');

    console.log('handleInquiriesFetch - Property ID filter:', propertyId);

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
          primary_image,
          owner_id
        )
      `)
      .order('created_at', { ascending: false });

    // Apply property filter if provided
    if (propertyId) {
      console.log('handleInquiriesFetch - Applying property_id filter:', propertyId);
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
    console.error('handleInquiriesFetch - Query error:', error);
    return jsonResponseNoCache(
      { error: 'Failed to fetch inquiries' },
      { status: 500 }
    );
  }

  console.log('handleInquiriesFetch - Found inquiries:', inquiries?.length || 0);
  if (inquiries && inquiries.length > 0) {
    console.log('handleInquiriesFetch - First inquiry:', inquiries[0]);
  }

  return jsonResponseNoCache({ inquiries: inquiries || [] });

  } catch (error: any) {
    console.error('handleInquiriesFetch error:', error);
    return jsonResponseNoCache(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
