import { NextRequest } from 'next/server';
import { jsonResponseNoCache } from '@/lib/api-helpers';
import { sendPropertyRejectionEmail } from '@/lib/sendgrid';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { email, name, propertyName, rejectionReason } = await request.json();

    if (!email || !name || !propertyName) {
      return jsonResponseNoCache(
        { error: 'Email, name, and property name are required' },
        { status: 400 }
      );
    }

    console.log(`📧 Sending property rejection notification to ${email}`);

    const success = await sendPropertyRejectionEmail(email, name, propertyName, rejectionReason);

    if (success) {
      return jsonResponseNoCache({
        success: true,
        message: 'Property rejection email sent successfully'
      });
    } else {
      return jsonResponseNoCache(
        { error: 'Failed to send property rejection email' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error sending property rejection email:', error);
    return jsonResponseNoCache(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
