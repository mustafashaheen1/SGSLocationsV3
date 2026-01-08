import { NextResponse } from 'next/server';
import { createServerSideClient, createServerSideClientWithToken } from '@/lib/supabase-server';
import { deleteProjectAndReorder } from '@/lib/project-position-manager';

/**
 * DELETE /api/projects/:id
 * Delete a project and automatically reorder remaining projects
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const projectId = params.id;

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Delete the project and reorder positions
    const result = await deleteProjectAndReorder(projectId, supabase as any);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      affectedCount: result.affectedCount
    });
  } catch (error: any) {
    console.error('Error in delete project API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
