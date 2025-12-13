import { NextRequest } from 'next/server';
import { jsonResponseNoCache } from '@/lib/api-helpers';
import { sendWelcomeEmail } from '@/lib/sendgrid';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json();

    if (!email || !name) {
      return jsonResponseNoCache(
        { error: 'Email and name are required' },
        { status: 400 }
      );
    }

    console.log(`📧 Sending welcome email to ${email}`);

    const success = await sendWelcomeEmail(email, name);

    if (success) {
      return jsonResponseNoCache({
        success: true,
        message: 'Welcome email sent successfully'
      });
    } else {
      return jsonResponseNoCache(
        { error: 'Failed to send welcome email' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error sending welcome email:', error);
    return jsonResponseNoCache(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
