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

    const supabase = createClient();

    // Check if user exists
    const { data: userData, error: userError } = await (supabase
      .from('users') as any)
      .select('id, full_name, email')
      .eq('email', email)
      .maybeSingle();

    if (userError) {
      console.error('Error checking user:', userError);
      return jsonResponseNoCache(
        { error: 'An error occurred while processing your request' },
        { status: 500 }
      );
    }

    if (!userData) {
      // User doesn't exist - return error
      return jsonResponseNoCache(
        { error: 'No account found with this email address' },
        { status: 404 }
      );
    }

    // Generate password reset link using admin client (doesn't send email automatically)
    const adminClient = createAdminClient();
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
      userData.full_name || 'User',
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
