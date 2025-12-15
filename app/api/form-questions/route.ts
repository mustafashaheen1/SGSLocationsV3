import { NextRequest } from 'next/server';
import { jsonResponseNoCache } from '@/lib/api-helpers';
import { createAdminClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Fetch all form questions for a specific form
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const formName = searchParams.get('form_name') || 'list_your_property';

    const adminClient = createAdminClient();

    const { data, error } = await adminClient
      .from('form_questions')
      .select('*')
      .eq('form_name', formName)
      .order('display_order');

    if (error) {
      console.error('Error fetching form questions:', error);
      return jsonResponseNoCache(
        { error: 'Failed to fetch form questions', message: error.message },
        { status: 500 }
      );
    }

    return jsonResponseNoCache({ data });
  } catch (error: any) {
    console.error('Error in GET /api/form-questions:', error);
    return jsonResponseNoCache(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

// POST - Create or update a form question
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, form_name, question_text, question_type, is_required, display_order, options } = body;

    if (!question_text || !question_type) {
      return jsonResponseNoCache(
        { error: 'question_text and question_type are required' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    const { data, error } = await adminClient
      .from('form_questions')
      .upsert({
        id,
        form_name: form_name || 'list_your_property',
        question_text,
        question_type,
        is_required: is_required ?? true,
        display_order: display_order ?? 999,
        options: options || []
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving form question:', error);
      return jsonResponseNoCache(
        { error: 'Failed to save form question', message: error.message },
        { status: 500 }
      );
    }

    return jsonResponseNoCache({ data });
  } catch (error: any) {
    console.error('Error in POST /api/form-questions:', error);
    return jsonResponseNoCache(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete a form question
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return jsonResponseNoCache(
        { error: 'Question ID is required' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    const { error } = await adminClient
      .from('form_questions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting form question:', error);
      return jsonResponseNoCache(
        { error: 'Failed to delete form question', message: error.message },
        { status: 500 }
      );
    }

    return jsonResponseNoCache({ success: true });
  } catch (error: any) {
    console.error('Error in DELETE /api/form-questions:', error);
    return jsonResponseNoCache(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
