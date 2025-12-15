import { NextRequest } from 'next/server';
import { jsonResponseNoCache } from '@/lib/api-helpers';
import { sendPasswordResetEmail } from '@/lib/sendgrid';
import { createClient, createAdminClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return jsonResponseNoCache(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Use admin client to check if user exists in Supabase Auth
    const adminClient = createAdminClient();

    // Check if user exists in auth
    const { data: authUsers, error: authError } = await adminClient.auth.admin.listUsers();

    if (authError) {
      console.error('Error checking auth users:', authError);
      return jsonResponseNoCache(
        { error: 'An error occurred while processing your request' },
        { status: 500 }
      );
    }

    const authUser = authUsers.users.find((u: any) => u.email === email);

    if (!authUser) {
      // User doesn't exist in auth - return error
      return jsonResponseNoCache(
        { error: 'No account found with this email address' },
        { status: 404 }
      );
    }

    // Try to get user's full name from users table (optional)
    const supabase = createClient();
    const { data: userData } = await (supabase
      .from('users') as any)
      .select('full_name')
      .eq('email', email)
      .maybeSingle();

    const fullName = userData?.full_name || authUser.user_metadata?.full_name || 'User';

    // Generate password reset link (reuse admin client from above)
    const { data, error } = await adminClient.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`
      }
    });

    if (error) {
      console.error('Supabase password reset link generation error:', error);
      return jsonResponseNoCache(
        { error: 'Failed to generate password reset link' },
        { status: 500 }
      );
    }

    if (!data.properties?.action_link) {
      console.error('No action link generated');
      return jsonResponseNoCache(
        { error: 'Failed to generate password reset link' },
        { status: 500 }
      );
    }

    // Send password reset email via SendGrid
    const emailSent = await sendPasswordResetEmail(
      email,
      fullName,
      data.properties.action_link
    );

    if (!emailSent) {
      console.error(`Failed to send password reset email to ${email}`);
      return jsonResponseNoCache(
        { error: 'Failed to send password reset email' },
        { status: 500 }
      );
    }

    console.log(`📧 Password reset email sent to ${email} via SendGrid`);

    return jsonResponseNoCache({
      success: true,
      message: 'Password reset link has been sent to your email'
    });
  } catch (error: any) {
    console.error('Error sending password reset email:', error);
    return jsonResponseNoCache(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
