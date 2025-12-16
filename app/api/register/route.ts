import { createServerSideClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import { jsonResponseNoCache } from '@/lib/api-helpers';
import { verifyRecaptcha } from '@/lib/recaptcha';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      firstName,
      lastName,
      userType,
      recaptcha_token
    } = body;

    // Verify reCAPTCHA token
    const recaptchaResult = await verifyRecaptcha(recaptcha_token);
    if (!recaptchaResult.success) {
      return jsonResponseNoCache(
        { error: recaptchaResult.error || 'reCAPTCHA verification failed' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return jsonResponseNoCache(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return jsonResponseNoCache(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = await createServerSideClient();

    // Sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      return jsonResponseNoCache(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return jsonResponseNoCache(
        { error: 'User creation failed' },
        { status: 500 }
      );
    }

    // Insert user profile
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: email,
        full_name: `${firstName} ${lastName}`.trim(),
        user_type: userType || 'production',
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      return jsonResponseNoCache(
        { error: profileError.message },
        { status: 500 }
      );
    }

    // Send welcome email
    try {
      await fetch(`${request.nextUrl.origin}/api/send-welcome-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          name: `${firstName} ${lastName}`.trim()
        })
      });
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't block registration if email fails
    }

    return jsonResponseNoCache(
      {
        success: true,
        user: {
          id: authData.user.id,
          email: authData.user.email
        }
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Registration API error:', error);
    return jsonResponseNoCache(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
