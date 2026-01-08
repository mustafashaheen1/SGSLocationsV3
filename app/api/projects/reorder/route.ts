import { NextResponse } from 'next/server';
import { createServerSideClient, createServerSideClientWithToken } from '@/lib/supabase-server';
import { updateProjectPosition, normalizeAllPositions } from '@/lib/project-position-manager';

/**
 * POST /api/projects/reorder
 * Update a project's position with automatic shifting of other projects
 */
export async function POST(request: Request) {
  try {
    // Try to get token from Authorization header first
    const authHeader = request.headers.get('authorization');
    let supabase;
    let user;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      supabase = createServerSideClientWithToken(token);

      // When using token-based auth, get the user directly
      const { data: { user: tokenUser }, error: userError } = await supabase.auth.getUser();
      if (userError || !tokenUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      user = tokenUser;
    } else {
      supabase = await createServerSideClient();

      // When using cookie-based auth, get session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      user = session.user;
    }

    // Verify admin access
    const { data: admin } = await (supabase as any)
      .from('admins')
      .select('id')
      .eq('email', user.email)
      .single();

    if (!admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { projectId, newPosition, action } = body;

    // Handle normalize action
    if (action === 'normalize') {
      const result = await normalizeAllPositions();
      return NextResponse.json(result);
    }

    // Validate required fields
    if (!projectId || !newPosition) {
      return NextResponse.json(
        { error: 'projectId and newPosition are required' },
        { status: 400 }
      );
    }

    // Validate position is a positive integer
    const position = parseInt(newPosition);
    if (isNaN(position) || position < 1) {
      return NextResponse.json(
        { error: 'newPosition must be a positive integer' },
        { status: 400 }
      );
    }

    // Update the project position
    const result = await updateProjectPosition(projectId, position);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in reorder API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
