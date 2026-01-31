import { NextRequest } from 'next/server';
import { jsonResponseNoCache } from '@/lib/api-helpers';
import { sendPasswordResetEmail } from '@/lib/sendgrid';
import { createClient, createAdminClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    console.log('[Password Reset] Starting password reset request');

    const { email } = await request.json();
    console.log('[Password Reset] Email:', email);

    if (!email) {
      console.log('[Password Reset] No email provided');
      return jsonResponseNoCache(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Use admin client to generate password reset link and get user info
    console.log('[Password Reset] Creating admin client');
    const adminClient = createAdminClient();
    console.log('[Password Reset] Admin client created successfully');

    // Try to get user's full name from users table using admin client (bypasses RLS)
    console.log('[Password Reset] Fetching user data from users table');
    const { data: userData, error: userDataError } = await adminClient
      .from('users')
      .select('full_name')
      .eq('email', email)
      .maybeSingle();

    if (userDataError) {
      console.log('[Password Reset] Error fetching user data:', userDataError);
    } else {
      console.log('[Password Reset] User data fetched:', userData ? 'Found' : 'Not found');
    }

    const fullName = userData?.full_name || 'User';
    console.log('[Password Reset] Using full name:', fullName);

    // Generate password reset link
    // This will fail if user doesn't exist in Supabase Auth
    console.log('[Password Reset] Generating password reset link');
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sgslocations.com';
    const { data, error } = await adminClient.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${siteUrl}/reset-password`
      }
    });

    if (error) {
      console.error('[Password Reset] Supabase password reset link generation error:', error);

      // Check if user doesn't exist
      if (error.message?.includes('not found') || error.message?.includes('User not found')) {
        console.log('[Password Reset] User not found in auth');
        return jsonResponseNoCache(
          { error: 'No account found with this email address' },
          { status: 404 }
        );
      }

      console.log('[Password Reset] Other error generating link');
      return jsonResponseNoCache(
        { error: 'Failed to generate password reset link' },
        { status: 500 }
      );
    }

    console.log('[Password Reset] Link generated successfully');

    if (!data.properties?.action_link) {
      console.error('[Password Reset] No action link generated');
      return jsonResponseNoCache(
        { error: 'Failed to generate password reset link' },
        { status: 500 }
      );
    }

    console.log('[Password Reset] Action link:', data.properties.action_link.substring(0, 50) + '...');

    // Send password reset email via SendGrid
    console.log('[Password Reset] Sending email via SendGrid');
    const emailSent = await sendPasswordResetEmail(
      email,
      fullName,
      data.properties.action_link
    );

    if (!emailSent) {
      console.error(`[Password Reset] Failed to send password reset email to ${email}`);
      return jsonResponseNoCache(
        { error: 'Failed to send password reset email' },
        { status: 500 }
      );
    }

    console.log(`[Password Reset] ✅ Password reset email sent to ${email} via SendGrid`);

    return jsonResponseNoCache({
      success: true,
      message: 'Password reset link has been sent to your email'
    });
  } catch (error: any) {
    console.error('[Password Reset] CAUGHT EXCEPTION:', error);
    console.error('[Password Reset] Error message:', error.message);
    console.error('[Password Reset] Error stack:', error.stack);
    return jsonResponseNoCache(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
