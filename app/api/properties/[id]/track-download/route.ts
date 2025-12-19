import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase';
import { jsonResponseNoCache } from '@/lib/api-helpers';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const propertyId = params.id;

    // Try to get current user (if logged in)
    let userId: string | null = null;
    try {
      const userSupabase = createClient();
      const { data: { user } } = await userSupabase.auth.getUser();
      userId = user?.id || null;
    } catch (userError) {
      console.log('Not logged in, tracking as anonymous');
    }

    // Use admin client to bypass RLS for anonymous tracking
    const supabase = createAdminClient();

    // Track as a single ZIP download event
    const { error } = await (supabase.from('image_downloads') as any).insert({
      property_id: propertyId,
      image_url: 'ZIP_DOWNLOAD',
      user_id: userId
    });

    if (error) {
      console.error('❌ Download tracking error:', error);
      return jsonResponseNoCache({ error: 'Failed to track download' }, { status: 500 });
    }

    console.log('✓ Download tracked successfully for property:', propertyId, 'User:', userId || 'anonymous');

    return jsonResponseNoCache({ success: true });
  } catch (error) {
    console.error('Error in track-download:', error);
    return jsonResponseNoCache(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
