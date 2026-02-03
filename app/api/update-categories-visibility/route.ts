import { NextRequest } from 'next/server';
import { jsonResponseNoCache } from '@/lib/api-helpers';
import { createAdminClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('[Update Categories] Starting update...');

    const adminClient = createAdminClient();

    // First, get all categories to filter sub-categories
    const { data: allCategories, error: fetchError } = await adminClient
      .from('categories')
      .select('id, parent_id');

    if (fetchError) {
      console.error('[Update Categories] Fetch error:', fetchError);
      return jsonResponseNoCache(
        { error: 'Failed to fetch categories', details: fetchError.message },
        { status: 500 }
      );
    }

    // Filter sub-categories (those with parent_id)
    const subCategories = (allCategories || []).filter((cat: any) => cat.parent_id !== null);
    const subCategoryIds = subCategories.map((cat: any) => cat.id);

    if (subCategoryIds.length === 0) {
      return jsonResponseNoCache({
        success: true,
        message: 'No sub-categories found to update',
        updated_count: 0
      });
    }

    console.log(`[Update Categories] Found ${subCategoryIds.length} sub-categories to update`);

    // Update all sub-categories to show in location library
    const { data, error } = await adminClient
      .from('categories')
      .update({ show_in_location_library: true })
      .in('id', subCategoryIds)
      .select();

    if (error) {
      console.error('[Update Categories] Update error:', error);
      return jsonResponseNoCache(
        { error: 'Failed to update categories', details: error.message },
        { status: 500 }
      );
    }

    console.log(`[Update Categories] Successfully updated ${data?.length || 0} sub-categories`);

    return jsonResponseNoCache({
      success: true,
      message: `Updated ${data?.length || 0} sub-categories to be visible in location library`,
      updated_count: data?.length || 0
    });
  } catch (error: any) {
    console.error('[Update Categories] Exception:', error);
    return jsonResponseNoCache(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
