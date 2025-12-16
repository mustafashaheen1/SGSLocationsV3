import { NextRequest } from 'next/server';
import sgMail from '@sendgrid/mail';
import { jsonResponseNoCache } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, propertyName, propertyAddress } = body;

    if (!email || !name) {
      return jsonResponseNoCache(
        { error: 'Email and name are required' },
        { status: 400 }
      );
    }

    const msg = {
      to: email,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'noreply@sgslocations.com',
        name: 'SGS Locations'
      },
      subject: 'Inquiry Received - SGS Locations',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Inquiry Confirmation</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 40px 0; text-align: center; background-color: #ffffff;">
                <img src="https://sgslocations.com/logo.png" alt="SGS Locations" style="height: 60px;" />
              </td>
            </tr>
            <tr>
              <td style="padding: 40px 30px; background-color: #ffffff;">
                <h1 style="color: #e11921; margin: 0 0 20px 0; font-size: 28px;">Inquiry Received</h1>

                <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                  Dear ${name},
                </p>

                <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                  Thank you for your inquiry! We have received your message and will get back to you as soon as possible.
                </p>

                ${propertyName ? `
                  <div style="background-color: #f8f8f8; border-left: 4px solid #e11921; padding: 15px; margin: 20px 0;">
                    <p style="color: #333333; font-size: 14px; margin: 0 0 5px 0;"><strong>Property:</strong></p>
                    <p style="color: #555555; font-size: 14px; margin: 0;">${propertyName}</p>
                    ${propertyAddress ? `<p style="color: #777777; font-size: 13px; margin: 5px 0 0 0;">${propertyAddress}</p>` : ''}
                  </div>
                ` : ''}

                <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                  Our team typically responds within 24 business hours. If you need immediate assistance, please call us at <strong>(214) 555-0100</strong>.
                </p>

                <div style="margin: 30px 0; padding: 20px; background-color: #f8f8f8; border-radius: 5px;">
                  <p style="color: #555555; font-size: 14px; line-height: 1.6; margin: 0;">
                    <strong>What happens next?</strong><br/>
                    • Our team will review your inquiry<br/>
                    • We'll reach out with available options<br/>
                    • You'll receive all the information you need to move forward
                  </p>
                </div>

                <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 20px 0 0 0;">
                  Best regards,<br/>
                  <strong>The SGS Locations Team</strong>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding: 30px; text-align: center; background-color: #333333;">
                <p style="color: #ffffff; font-size: 14px; margin: 0 0 10px 0;">
                  SGS Locations - Dallas-Fort Worth's Premier Location Service
                </p>
                <p style="color: #999999; font-size: 12px; margin: 0;">
                  <a href="https://sgslocations.com" style="color: #e11921; text-decoration: none;">Visit our website</a> |
                  <a href="mailto:info@sgslocations.com" style="color: #e11921; text-decoration: none;">Contact us</a>
                </p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };

    await sgMail.send(msg);

    return jsonResponseNoCache({
      success: true,
      message: 'Inquiry confirmation email sent successfully'
    });

  } catch (error: any) {
    console.error('Error sending inquiry confirmation email:', error);

    // Return success even if email fails - don't block the inquiry submission
    return jsonResponseNoCache({
      success: false,
      error: error.message || 'Failed to send email'
    }, { status: 500 });
  }
}
