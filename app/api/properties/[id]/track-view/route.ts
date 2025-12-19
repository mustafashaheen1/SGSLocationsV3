import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { jsonResponseNoCache } from '@/lib/api-helpers';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const propertyId = params.id;

    // Use admin client to bypass RLS for anonymous tracking
    const supabase = createAdminClient();

    // Get current view count
    const { data: property, error: fetchError } = await (supabase
      .from('properties') as any)
      .select('view_count')
      .eq('id', propertyId)
      .single();

    if (fetchError) {
      console.error('Error fetching property view count:', fetchError);
      return jsonResponseNoCache({ error: 'Property not found' }, { status: 404 });
    }

    // Increment view count
    const newViewCount = (property.view_count || 0) + 1;
    const { error: updateError } = await (supabase
      .from('properties') as any)
      .update({ view_count: newViewCount })
      .eq('id', propertyId);

    if (updateError) {
      console.error('Error updating view count:', updateError);
      return jsonResponseNoCache({ error: 'Failed to track view' }, { status: 500 });
    }

    console.log('✓ View tracked for property:', propertyId, '- New count:', newViewCount);

    return jsonResponseNoCache({ success: true, view_count: newViewCount });
  } catch (error) {
    console.error('Error in track-view:', error);
    return jsonResponseNoCache(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
