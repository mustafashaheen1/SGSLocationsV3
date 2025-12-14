import { NextRequest } from 'next/server';
import { jsonResponseNoCache } from '@/lib/api-helpers';
import { sendPropertyApprovalEmail } from '@/lib/sendgrid';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { email, name, propertyName, propertyId } = await request.json();

    if (!email || !name || !propertyName || !propertyId) {
      return jsonResponseNoCache(
        { error: 'Email, name, property name, and property ID are required' },
        { status: 400 }
      );
    }

    console.log(`📧 Sending property approval notification to ${email}`);

    const success = await sendPropertyApprovalEmail(email, name, propertyName, propertyId);

    if (success) {
      return jsonResponseNoCache({
        success: true,
        message: 'Property approval email sent successfully'
      });
    } else {
      return jsonResponseNoCache(
        { error: 'Failed to send property approval email' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error sending property approval email:', error);
    return jsonResponseNoCache(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
