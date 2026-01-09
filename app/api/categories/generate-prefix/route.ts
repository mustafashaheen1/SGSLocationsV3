import { NextRequest } from 'next/server';
import { jsonResponseNoCache } from '@/lib/api-helpers';
import { supabase } from '@/lib/supabase';

/**
 * API endpoint to generate a unique 3-letter prefix for a category name
 * Used by the admin panel when creating new main categories
 *
 * @route POST /api/categories/generate-prefix
 * @body { name: string } - The category name to generate a prefix for
 * @returns { prefix: string } - The generated unique prefix
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    // Validate input
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return jsonResponseNoCache(
        { error: 'Category name is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Call the database function to generate a unique prefix
    const { data, error } = await (supabase as any).rpc('generate_unique_prefix', {
      category_name: name.trim()
    });

    if (error) {
      console.error('Error generating prefix:', error);
      return jsonResponseNoCache(
        { error: 'Failed to generate prefix: ' + error.message },
        { status: 500 }
      );
    }

    // Ensure we got a valid prefix back
    if (!data || typeof data !== 'string' || data.length !== 3) {
      console.error('Invalid prefix generated:', data);
      return jsonResponseNoCache(
        { error: 'Generated invalid prefix' },
        { status: 500 }
      );
    }

    return jsonResponseNoCache({ prefix: data });
  } catch (error: any) {
    console.error('Error in generate-prefix API:', error);
    return jsonResponseNoCache(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}
