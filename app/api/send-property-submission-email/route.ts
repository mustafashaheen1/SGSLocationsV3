import { NextRequest } from 'next/server';
import { jsonResponseNoCache } from '@/lib/api-helpers';
import { sendPropertySubmissionEmail } from '@/lib/sendgrid';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { email, name, propertyAddress } = await request.json();

    if (!email || !name || !propertyAddress) {
      return jsonResponseNoCache(
        { error: 'Email, name, and property address are required' },
        { status: 400 }
      );
    }

    console.log(`📧 Sending property submission confirmation to ${email}`);

    const success = await sendPropertySubmissionEmail(email, name, propertyAddress);

    if (success) {
      return jsonResponseNoCache({
        success: true,
        message: 'Property submission confirmation email sent successfully'
      });
    } else {
      return jsonResponseNoCache(
        { error: 'Failed to send property submission confirmation email' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error sending property submission confirmation email:', error);
    return jsonResponseNoCache(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
