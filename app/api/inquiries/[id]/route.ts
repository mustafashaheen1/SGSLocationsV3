import { createServerSideClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Parse request body
    const body = await request.json();
    const { status, admin_notes } = body;

    // Validate status if provided
    if (status && !['new', 'responded', 'archived'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value. Must be: new, responded, or archived' },
        { status: 400 }
      );
    }

    // Check permissions: user must be admin or property owner
    const { data: adminCheck } = await supabase
      .from('admins')
      .select('id')
      .eq('email', user.email)
      .maybeSingle();

    const isAdmin = !!adminCheck;

    // If not admin, check if user is property owner of this inquiry's property
    if (!isAdmin) {
      const { data: inquiry } = await supabase
        .from('inquiries')
        .select('property_id')
        .eq('id', params.id)
        .single();

      if (inquiry?.property_id) {
        const { data: property } = await supabase
          .from('properties')
          .select('owner_id')
          .eq('id', inquiry.property_id)
          .single();

        if (property?.owner_id !== user.id) {
          return NextResponse.json(
            { error: 'Insufficient permissions. Only admins and property owners can update inquiry status.' },
            { status: 403 }
          );
        }
      } else {
        // No property associated with inquiry, only admins can update
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
    }

    // Build update object
    const updateData: any = {};
    if (status) {
      updateData.status = status;
      if (status === 'responded') {
        updateData.responded_at = new Date().toISOString();
      }
    }
    if (admin_notes !== undefined) {
      updateData.admin_notes = admin_notes;
    }

    // Update inquiry
    const { data: inquiry, error: updateError } = await supabase
      .from('inquiries')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating inquiry:', updateError);
      return NextResponse.json(
        { error: 'Failed to update inquiry' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, inquiry });

  } catch (error: any) {
    console.error('Inquiry update API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
