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

    // Use admin client to generate password reset link and get user info
    const adminClient = createAdminClient();

    // Try to get user's full name from users table using admin client (bypasses RLS)
    const { data: userData } = await adminClient
      .from('users')
      .select('full_name')
      .eq('email', email)
      .maybeSingle();

    const fullName = userData?.full_name || 'User';

    // Generate password reset link
    // This will fail if user doesn't exist in Supabase Auth
    const { data, error } = await adminClient.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`
      }
    });

    if (error) {
      console.error('Supabase password reset link generation error:', error);

      // Check if user doesn't exist
      if (error.message?.includes('not found') || error.message?.includes('User not found')) {
        return jsonResponseNoCache(
          { error: 'No account found with this email address' },
          { status: 404 }
        );
      }

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
