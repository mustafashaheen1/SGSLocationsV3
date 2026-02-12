import { NextRequest } from 'next/server';
import sgMail from '@sendgrid/mail';
import { jsonResponseNoCache } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase';

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

    // Fetch site logo from app_settings
    const supabase = createClient();
    let logoUrl = 'https://sgslocations.com/logo.png'; // Default fallback

    try {
      const { data: logoData } = await (supabase
        .from('app_settings') as any)
        .select('setting_value')
        .eq('setting_key', 'site_logo_url')
        .maybeSingle();

      if (logoData?.setting_value) {
        logoUrl = logoData.setting_value;
      }
    } catch (error) {
      console.error('Error fetching logo:', error);
      // Continue with default logo
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
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <title>Inquiry Confirmation</title>
          <style type="text/css">
            body {
              margin: 0;
              padding: 0;
              -webkit-text-size-adjust: 100%;
              -ms-text-size-adjust: 100%;
            }
            table {
              border-collapse: collapse;
              mso-table-lspace: 0pt;
              mso-table-rspace: 0pt;
            }
            img {
              border: 0;
              height: auto;
              line-height: 100%;
              outline: none;
              text-decoration: none;
              -ms-interpolation-mode: bicubic;
            }
            @media only screen and (max-width: 600px) {
              .email-container {
                width: 100% !important;
              }
              .mobile-padding {
                padding: 20px 15px !important;
              }
              .mobile-padding-small {
                padding: 15px 10px !important;
              }
              .mobile-heading {
                font-size: 24px !important;
              }
              .mobile-text {
                font-size: 14px !important;
              }
              .mobile-small-text {
                font-size: 12px !important;
              }
              .mobile-logo {
                height: 50px !important;
              }
            }
          </style>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f4f4;">
            <tr>
              <td align="center" style="padding: 20px 10px;">
                <table class="email-container" role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                  <!-- Logo Header -->
                  <tr>
                    <td class="mobile-padding" style="padding: 40px 30px; text-align: center; background-color: #ffffff;">
                      <img src="${logoUrl}" alt="SGS Locations" class="mobile-logo" style="height: 60px; max-width: 100%;" />
                    </td>
                  </tr>

                  <!-- Main Content -->
                  <tr>
                    <td class="mobile-padding" style="padding: 40px 30px; background-color: #ffffff;">
                      <h1 class="mobile-heading" style="color: #cc5500; margin: 0 0 20px 0; font-size: 28px; font-weight: bold;">Inquiry Received</h1>

                      <p class="mobile-text" style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Dear ${name},
                      </p>

                      <p class="mobile-text" style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Thank you for your inquiry! We have received your message and will get back to you as soon as possible.
                      </p>

                      ${propertyName ? `
                        <div class="mobile-padding-small" style="background-color: #f8f8f8; border-left: 4px solid #cc5500; padding: 15px; margin: 20px 0; border-radius: 0 5px 5px 0;">
                          <p class="mobile-text" style="color: #333333; font-size: 14px; margin: 0 0 5px 0;"><strong>Property:</strong></p>
                          <p class="mobile-text" style="color: #555555; font-size: 14px; margin: 0; word-wrap: break-word;">${propertyName}</p>
                          ${propertyAddress ? `<p class="mobile-small-text" style="color: #777777; font-size: 13px; margin: 5px 0 0 0; word-wrap: break-word;">${propertyAddress}</p>` : ''}
                        </div>
                      ` : ''}

                      <p class="mobile-text" style="color: #333333; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                        Our team typically responds within 24 business hours. If you need immediate assistance, please call us at <strong style="white-space: nowrap;">(214) 555-0100</strong>.
                      </p>

                      <div class="mobile-padding-small" style="margin: 30px 0; padding: 20px; background-color: #f8f8f8; border-radius: 5px;">
                        <p class="mobile-text" style="color: #555555; font-size: 14px; line-height: 1.8; margin: 0;">
                          <strong>What happens next?</strong><br/>
                          • Our team will review your inquiry<br/>
                          • We'll reach out with available options<br/>
                          • You'll receive all the information you need to move forward
                        </p>
                      </div>

                      <p class="mobile-text" style="color: #333333; font-size: 16px; line-height: 1.6; margin: 20px 0 0 0;">
                        Best regards,<br/>
                        <strong>The SGS Locations Team</strong>
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td class="mobile-padding-small" style="padding: 30px; text-align: center; background-color: #333333;">
                      <p class="mobile-text" style="color: #ffffff; font-size: 14px; margin: 0 0 10px 0; line-height: 1.4;">
                        SGS Locations - Dallas-Fort Worth's Premier Location Service
                      </p>
                      <p class="mobile-small-text" style="color: #999999; font-size: 12px; margin: 0; line-height: 1.6;">
                        <a href="https://sgslocations.com" style="color: #cc5500; text-decoration: none;">Visit our website</a>
                        <span style="color: #666666; padding: 0 5px;">|</span>
                        <a href="mailto:info@sgslocations.com" style="color: #cc5500; text-decoration: none;">Contact us</a>
                      </p>
                    </td>
                  </tr>
                </table>
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
