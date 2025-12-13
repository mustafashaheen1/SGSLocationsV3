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

    if (userError || !userData) {
      // Don't reveal if user exists or not (security best practice)
      return jsonResponseNoCache({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.'
      });
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
      // Still return success to not reveal if user exists
      return jsonResponseNoCache({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.'
      });
    }

    if (!data.properties?.action_link) {
      console.error('No action link generated');
      return jsonResponseNoCache({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.'
      });
    }

    // Send password reset email via SendGrid
    const emailSent = await sendPasswordResetEmail(
      email,
      userData.full_name || 'User',
      data.properties.action_link
    );

    if (emailSent) {
      console.log(`📧 Password reset email sent to ${email} via SendGrid`);
    } else {
      console.error(`Failed to send password reset email to ${email}`);
    }

    // Always return success to not reveal if user exists
    return jsonResponseNoCache({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.'
    });
  } catch (error: any) {
    console.error('Error sending password reset email:', error);
    return jsonResponseNoCache(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
