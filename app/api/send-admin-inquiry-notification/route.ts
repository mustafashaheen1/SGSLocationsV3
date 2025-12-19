import { NextRequest } from 'next/server';
import sgMail from '@sendgrid/mail';
import { jsonResponseNoCache } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      company,
      message,
      crewSize,
      locations,
      shootingDate,
      projectType,
      howDidYouHear,
      propertyName,
      propertyAddress
    } = body;

    if (!email || !firstName || !lastName || !message) {
      return jsonResponseNoCache(
        { error: 'Required fields are missing' },
        { status: 400 }
      );
    }

    const adminEmail = 'phillip@sgsholdings.com';

    const msg = {
      to: adminEmail,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'noreply@sgslocations.com',
        name: 'SGS Locations - Contact Form'
      },
      replyTo: email,
      subject: `New Contact Form Inquiry from ${firstName} ${lastName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <title>New Inquiry</title>
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
              .mobile-subheading {
                font-size: 18px !important;
              }
              .mobile-text {
                font-size: 14px !important;
              }
              .mobile-small-text {
                font-size: 12px !important;
              }
              .mobile-table td {
                display: block !important;
                width: 100% !important;
                padding: 4px 0 !important;
              }
              .mobile-table td:first-child {
                font-weight: bold !important;
                margin-bottom: 2px !important;
              }
            }
          </style>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f4f4;">
            <tr>
              <td align="center" style="padding: 20px 10px;">
                <table class="email-container" role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                  <tr>
                    <td class="mobile-padding" style="padding: 40px 30px; background-color: #ffffff;">
                      <h1 class="mobile-heading" style="color: #e11921; margin: 0 0 20px 0; font-size: 28px; font-weight: bold;">New Contact Form Inquiry</h1>

                      <p class="mobile-text" style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        A new inquiry has been submitted through the contact form.
                      </p>

                      <div class="mobile-padding-small" style="background-color: #f8f8f8; border-left: 4px solid #e11921; padding: 20px; margin: 20px 0; border-radius: 0 5px 5px 0;">
                        <h2 class="mobile-subheading" style="color: #e11921; margin: 0 0 15px 0; font-size: 20px;">Contact Information</h2>

                        <table class="mobile-table" style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td class="mobile-text" style="padding: 8px 0; color: #555555; font-size: 14px; font-weight: bold; width: 40%;">Name:</td>
                            <td class="mobile-text" style="padding: 8px 0; color: #333333; font-size: 14px; word-wrap: break-word;">${firstName} ${lastName}</td>
                          </tr>
                          <tr>
                            <td class="mobile-text" style="padding: 8px 0; color: #555555; font-size: 14px; font-weight: bold;">Email:</td>
                            <td class="mobile-text" style="padding: 8px 0; color: #333333; font-size: 14px; word-wrap: break-word;">
                              <a href="mailto:${email}" style="color: #e11921; text-decoration: none; word-wrap: break-word;">${email}</a>
                            </td>
                          </tr>
                          ${phone ? `
                          <tr>
                            <td class="mobile-text" style="padding: 8px 0; color: #555555; font-size: 14px; font-weight: bold;">Phone:</td>
                            <td class="mobile-text" style="padding: 8px 0; color: #333333; font-size: 14px;">
                              <a href="tel:${phone}" style="color: #e11921; text-decoration: none; white-space: nowrap;">${phone}</a>
                            </td>
                          </tr>
                          ` : ''}
                          ${company ? `
                          <tr>
                            <td class="mobile-text" style="padding: 8px 0; color: #555555; font-size: 14px; font-weight: bold;">Company:</td>
                            <td class="mobile-text" style="padding: 8px 0; color: #333333; font-size: 14px; word-wrap: break-word;">${company}</td>
                          </tr>
                          ` : ''}
                        </table>
                      </div>

                      ${propertyName ? `
                      <div class="mobile-padding-small" style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 20px 0; border-radius: 0 5px 5px 0;">
                        <h2 class="mobile-subheading" style="color: #856404; margin: 0 0 15px 0; font-size: 20px;">Property Inquiry</h2>
                        <p class="mobile-text" style="color: #333333; font-size: 14px; margin: 0; word-wrap: break-word;"><strong>${propertyName}</strong></p>
                        ${propertyAddress ? `<p class="mobile-small-text" style="color: #555555; font-size: 13px; margin: 5px 0 0 0; word-wrap: break-word;">${propertyAddress}</p>` : ''}
                      </div>
                      ` : ''}

                      <div class="mobile-padding-small" style="background-color: #e8f4f8; border-left: 4px solid #0c5460; padding: 20px; margin: 20px 0; border-radius: 0 5px 5px 0;">
                        <h2 class="mobile-subheading" style="color: #0c5460; margin: 0 0 15px 0; font-size: 20px;">Project Details</h2>

                        <table class="mobile-table" style="width: 100%; border-collapse: collapse;">
                          ${projectType ? `
                          <tr>
                            <td class="mobile-text" style="padding: 8px 0; color: #555555; font-size: 14px; font-weight: bold; width: 40%;">Project Type:</td>
                            <td class="mobile-text" style="padding: 8px 0; color: #333333; font-size: 14px;">${projectType}</td>
                          </tr>
                          ` : ''}
                          ${crewSize ? `
                          <tr>
                            <td class="mobile-text" style="padding: 8px 0; color: #555555; font-size: 14px; font-weight: bold;">Crew Size:</td>
                            <td class="mobile-text" style="padding: 8px 0; color: #333333; font-size: 14px;">${crewSize}</td>
                          </tr>
                          ` : ''}
                          ${locations ? `
                          <tr>
                            <td class="mobile-text" style="padding: 8px 0; color: #555555; font-size: 14px; font-weight: bold;">Locations:</td>
                            <td class="mobile-text" style="padding: 8px 0; color: #333333; font-size: 14px; word-wrap: break-word;">${locations}</td>
                          </tr>
                          ` : ''}
                          ${shootingDate ? `
                          <tr>
                            <td class="mobile-text" style="padding: 8px 0; color: #555555; font-size: 14px; font-weight: bold;">Shooting Date:</td>
                            <td class="mobile-text" style="padding: 8px 0; color: #333333; font-size: 14px; word-wrap: break-word;">${shootingDate}</td>
                          </tr>
                          ` : ''}
                          ${howDidYouHear ? `
                          <tr>
                            <td class="mobile-text" style="padding: 8px 0; color: #555555; font-size: 14px; font-weight: bold;">How They Heard:</td>
                            <td class="mobile-text" style="padding: 8px 0; color: #333333; font-size: 14px;">${howDidYouHear}</td>
                          </tr>
                          ` : ''}
                        </table>
                      </div>

                      <div class="mobile-padding-small" style="background-color: #f8f8f8; padding: 20px; margin: 20px 0; border-radius: 5px;">
                        <h2 class="mobile-subheading" style="color: #333333; margin: 0 0 15px 0; font-size: 20px;">Message</h2>
                        <p class="mobile-text" style="color: #333333; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-wrap; word-wrap: break-word;">${message}</p>
                      </div>

                      <div class="mobile-padding-small" style="margin: 30px 0; padding: 20px; background-color: #d4edda; border-left: 4px solid #28a745; border-radius: 0 5px 5px 0;">
                        <p class="mobile-text" style="color: #155724; font-size: 14px; line-height: 1.6; margin: 0;">
                          <strong>Action Required:</strong><br/>
                          Please respond to this inquiry within 24 hours. Click reply to respond directly to ${firstName} at ${email}.
                        </p>
                      </div>

                      <p class="mobile-small-text" style="color: #999999; font-size: 12px; margin: 30px 0 0 0;">
                        This email was automatically generated from the SGS Locations contact form.
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
      message: 'Admin notification email sent successfully'
    });

  } catch (error: any) {
    console.error('Error sending admin notification email:', error);

    // Return success even if email fails - don't block the inquiry submission
    return jsonResponseNoCache({
      success: false,
      error: error.message || 'Failed to send admin notification email'
    }, { status: 500 });
  }
}
