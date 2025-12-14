import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key
const apiKey = process.env.SENDGRID_API_KEY;
if (apiKey) {
  sgMail.setApiKey(apiKey);
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!apiKey) {
    console.error('SendGrid API key is not configured');
    return false;
  }

  const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@sgslocations.com';
  const fromName = process.env.SENDGRID_FROM_NAME || 'SGS Locations';

  const msg = {
    to: options.to,
    from: {
      email: fromEmail,
      name: fromName
    },
    subject: options.subject,
    html: options.html,
    text: options.text || options.html.replace(/<[^>]*>/g, '') // Strip HTML for text version
  };

  try {
    await sgMail.send(msg);
    console.log(`✓ Email sent to ${options.to}: ${options.subject}`);
    return true;
  } catch (error: any) {
    console.error('SendGrid error:', error.response?.body || error.message);
    return false;
  }
}

// Welcome email template
export function getWelcomeEmailTemplate(userName: string, userEmail: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to SGS Locations</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #DC2626; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to SGS Locations</h1>
        </div>

        <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1f2937; margin-top: 0;">Hello ${userName}!</h2>

          <p style="font-size: 16px; color: #4b5563;">
            Thank you for joining SGS Locations - Dallas Fort Worth's largest location database connecting property owners with production companies.
          </p>

          <p style="font-size: 16px; color: #4b5563;">
            Your account has been successfully created with the email: <strong>${userEmail}</strong>
          </p>

          <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #DC2626;">
            <h3 style="margin-top: 0; color: #1f2937;">What's Next?</h3>
            <ul style="color: #4b5563; padding-left: 20px;">
              <li>Browse our extensive database of filming locations</li>
              <li>Save your favorite properties</li>
              <li>Submit inquiries directly to property owners</li>
              <li>List your own property (if you're a property owner)</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://sgslocations.com'}"
               style="background-color: #DC2626; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Explore Properties
            </a>
          </div>

          <p style="font-size: 14px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
            If you have any questions, feel free to reach out to our support team.
          </p>

          <p style="font-size: 14px; color: #6b7280; margin-bottom: 0;">
            Best regards,<br>
            <strong>The SGS Locations Team</strong>
          </p>
        </div>

        <div style="text-align: center; margin-top: 20px; padding: 20px; color: #9ca3af; font-size: 12px;">
          <p>© ${new Date().getFullYear()} SGS Locations. All rights reserved.</p>
          <p style="margin: 5px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/contact" style="color: #9ca3af; text-decoration: none;">Contact Us</a> |
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/about" style="color: #9ca3af; text-decoration: none;">About</a>
          </p>
        </div>
      </body>
    </html>
  `;
}

// Password reset email template
export function getPasswordResetEmailTemplate(userName: string, resetLink: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #DC2626; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset Request</h1>
        </div>

        <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1f2937; margin-top: 0;">Hello ${userName},</h2>

          <p style="font-size: 16px; color: #4b5563;">
            We received a request to reset your password for your SGS Locations account.
          </p>

          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>Important:</strong> This password reset link will expire in 1 hour for security reasons.
            </p>
          </div>

          <p style="font-size: 16px; color: #4b5563;">
            Click the button below to reset your password:
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}"
               style="background-color: #DC2626; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Reset Password
            </a>
          </div>

          <p style="font-size: 14px; color: #6b7280;">
            If the button doesn't work, copy and paste this link into your browser:
          </p>
          <p style="font-size: 12px; color: #9ca3af; word-break: break-all; background-color: white; padding: 10px; border-radius: 4px;">
            ${resetLink}
          </p>

          <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
            <p style="margin: 0; color: #1e40af; font-size: 14px;">
              <strong>Didn't request this?</strong> You can safely ignore this email. Your password will not be changed.
            </p>
          </div>

          <p style="font-size: 14px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
            For security, this link will only work once and expires in 1 hour.
          </p>

          <p style="font-size: 14px; color: #6b7280; margin-bottom: 0;">
            Best regards,<br>
            <strong>The SGS Locations Team</strong>
          </p>
        </div>

        <div style="text-align: center; margin-top: 20px; padding: 20px; color: #9ca3af; font-size: 12px;">
          <p>© ${new Date().getFullYear()} SGS Locations. All rights reserved.</p>
          <p style="margin: 5px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/contact" style="color: #9ca3af; text-decoration: none;">Contact Us</a> |
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/about" style="color: #9ca3af; text-decoration: none;">About</a>
          </p>
        </div>
      </body>
    </html>
  `;
}

// Property submission confirmation email template
export function getPropertySubmissionEmailTemplate(userName: string, propertyAddress: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Property Submission Received</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #DC2626; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Property Submission Received</h1>
        </div>

        <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1f2937; margin-top: 0;">Hello ${userName}!</h2>

          <p style="font-size: 16px; color: #4b5563;">
            Thank you for submitting your property to SGS Locations. We have successfully received your listing submission.
          </p>

          <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #DC2626;">
            <h3 style="margin-top: 0; color: #1f2937;">Property Details</h3>
            <p style="color: #4b5563; margin: 5px 0;">
              <strong>Address:</strong> ${propertyAddress}
            </p>
            <p style="color: #4b5563; margin: 5px 0;">
              <strong>Status:</strong> Pending Review
            </p>
          </div>

          <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
            <h3 style="margin-top: 0; color: #1f2937;">What Happens Next?</h3>
            <ol style="color: #4b5563; padding-left: 20px; margin: 10px 0;">
              <li style="margin-bottom: 10px;">Our team will review your property submission within 2-3 business days</li>
              <li style="margin-bottom: 10px;">We may contact you if we need additional information or photos</li>
              <li style="margin-bottom: 10px;">Once approved, your property will be added to our location database</li>
              <li style="margin-bottom: 10px;">You'll receive an email notification when your property is live</li>
            </ol>
          </div>

          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>Important:</strong> You can track the status of your submission and manage your properties from your dashboard.
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://sgslocations.com'}/dashboard"
               style="background-color: #DC2626; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              View Dashboard
            </a>
          </div>

          <p style="font-size: 14px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
            If you have any questions about your submission, feel free to contact our support team.
          </p>

          <p style="font-size: 14px; color: #6b7280; margin-bottom: 0;">
            Best regards,<br>
            <strong>The SGS Locations Team</strong>
          </p>
        </div>

        <div style="text-align: center; margin-top: 20px; padding: 20px; color: #9ca3af; font-size: 12px;">
          <p>© ${new Date().getFullYear()} SGS Locations. All rights reserved.</p>
          <p style="margin: 5px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/contact" style="color: #9ca3af; text-decoration: none;">Contact Us</a> |
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/about" style="color: #9ca3af; text-decoration: none;">About</a>
          </p>
        </div>
      </body>
    </html>
  `;
}

// Property approval email template
export function getPropertyApprovalEmailTemplate(userName: string, propertyName: string, propertyId: string): string {
  const propertyUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/property/${propertyId}`;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Property Approved</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #10B981; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Property Approved!</h1>
        </div>

        <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1f2937; margin-top: 0;">Great News, ${userName}!</h2>

          <p style="font-size: 16px; color: #4b5563;">
            We're excited to inform you that your property listing has been approved and is now live on SGS Locations!
          </p>

          <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981;">
            <h3 style="margin-top: 0; color: #1f2937;">Property Details</h3>
            <p style="color: #4b5563; margin: 5px 0;">
              <strong>Property:</strong> ${propertyName}
            </p>
            <p style="color: #4b5563; margin: 5px 0;">
              <strong>Status:</strong> <span style="color: #10B981; font-weight: bold;">Active</span>
            </p>
          </div>

          <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
            <h3 style="margin-top: 0; color: #1f2937;">What This Means</h3>
            <ul style="color: #4b5563; padding-left: 20px; margin: 10px 0;">
              <li style="margin-bottom: 10px;">Your property is now visible to all production companies searching our database</li>
              <li style="margin-bottom: 10px;">You may start receiving inquiries from interested producers</li>
              <li style="margin-bottom: 10px;">You can manage your property and view inquiries from your dashboard</li>
              <li style="margin-bottom: 10px;">Your property will appear in relevant search results and category pages</li>
            </ul>
          </div>

          <div style="background-color: #dcfce7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981;">
            <p style="margin: 0; color: #166534; font-size: 14px;">
              <strong>Tip:</strong> Make sure to respond promptly to inquiries to increase your chances of booking!
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${propertyUrl}"
               style="background-color: #10B981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; margin-right: 10px;">
              View Property
            </a>
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://sgslocations.com'}/dashboard"
               style="background-color: #DC2626; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Go to Dashboard
            </a>
          </div>

          <p style="font-size: 14px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
            If you have any questions or need assistance, feel free to contact our support team.
          </p>

          <p style="font-size: 14px; color: #6b7280; margin-bottom: 0;">
            Best regards,<br>
            <strong>The SGS Locations Team</strong>
          </p>
        </div>

        <div style="text-align: center; margin-top: 20px; padding: 20px; color: #9ca3af; font-size: 12px;">
          <p>© ${new Date().getFullYear()} SGS Locations. All rights reserved.</p>
          <p style="margin: 5px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/contact" style="color: #9ca3af; text-decoration: none;">Contact Us</a> |
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/about" style="color: #9ca3af; text-decoration: none;">About</a>
          </p>
        </div>
      </body>
    </html>
  `;
}

// Property rejection email template
export function getPropertyRejectionEmailTemplate(userName: string, propertyName: string, rejectionReason?: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Property Submission Update</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #DC2626; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Property Submission Update</h1>
        </div>

        <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1f2937; margin-top: 0;">Hello ${userName},</h2>

          <p style="font-size: 16px; color: #4b5563;">
            Thank you for submitting your property to SGS Locations. After careful review, we're unable to approve your property listing at this time.
          </p>

          <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #DC2626;">
            <h3 style="margin-top: 0; color: #1f2937;">Property Details</h3>
            <p style="color: #4b5563; margin: 5px 0;">
              <strong>Property:</strong> ${propertyName}
            </p>
            <p style="color: #4b5563; margin: 5px 0;">
              <strong>Status:</strong> <span style="color: #DC2626; font-weight: bold;">Not Approved</span>
            </p>
            ${rejectionReason ? `
              <p style="color: #4b5563; margin: 15px 0 5px 0;">
                <strong>Reason:</strong>
              </p>
              <p style="color: #4b5563; margin: 5px 0; background-color: #fef2f2; padding: 10px; border-radius: 4px;">
                ${rejectionReason}
              </p>
            ` : ''}
          </div>

          <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
            <h3 style="margin-top: 0; color: #1f2937;">What You Can Do</h3>
            <ul style="color: #4b5563; padding-left: 20px; margin: 10px 0;">
              <li style="margin-bottom: 10px;">Review our listing guidelines to ensure your property meets our requirements</li>
              <li style="margin-bottom: 10px;">Make any necessary updates to your property information or photos</li>
              <li style="margin-bottom: 10px;">Submit a new listing with the updated information</li>
              <li style="margin-bottom: 10px;">Contact our support team if you have questions about this decision</li>
            </ul>
          </div>

          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>Note:</strong> We're here to help! If you need clarification or assistance with resubmitting your property, please don't hesitate to reach out.
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://sgslocations.com'}/list-your-property"
               style="background-color: #DC2626; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; margin-right: 10px;">
              Submit New Listing
            </a>
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://sgslocations.com'}/contact"
               style="background-color: #6b7280; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Contact Support
            </a>
          </div>

          <p style="font-size: 14px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
            We appreciate your interest in SGS Locations and hope to work with you in the future.
          </p>

          <p style="font-size: 14px; color: #6b7280; margin-bottom: 0;">
            Best regards,<br>
            <strong>The SGS Locations Team</strong>
          </p>
        </div>

        <div style="text-align: center; margin-top: 20px; padding: 20px; color: #9ca3af; font-size: 12px;">
          <p>© ${new Date().getFullYear()} SGS Locations. All rights reserved.</p>
          <p style="margin: 5px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/contact" style="color: #9ca3af; text-decoration: none;">Contact Us</a> |
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/about" style="color: #9ca3af; text-decoration: none;">About</a>
          </p>
        </div>
      </body>
    </html>
  `;
}

// Property terms and conditions email template
export function getPropertyTermsEmailTemplate(
  userName: string,
  propertyName: string,
  termsType: 'text' | 'pdf',
  termsContent?: string,
  termsPdfUrl?: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Terms and Conditions</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #3b82f6; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Terms and Conditions</h1>
        </div>

        <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1f2937; margin-top: 0;">Hello ${userName},</h2>

          <p style="font-size: 16px; color: #4b5563;">
            Please review the following terms and conditions for your property listing on SGS Locations.
          </p>

          <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
            <h3 style="margin-top: 0; color: #1f2937;">Property Information</h3>
            <p style="color: #4b5563; margin: 5px 0;">
              <strong>Property:</strong> ${propertyName}
            </p>
          </div>

          ${termsType === 'text' && termsContent ? `
            <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981;">
              <h3 style="margin-top: 0; color: #1f2937;">Terms and Conditions</h3>
              <div style="color: #4b5563; white-space: pre-wrap; font-size: 14px; line-height: 1.8;">
                ${termsContent.replace(/\n/g, '<br>')}
              </div>
            </div>
          ` : ''}

          ${termsType === 'pdf' && termsPdfUrl ? `
            <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981;">
              <h3 style="margin-top: 0; color: #1f2937;">Terms and Conditions Document</h3>
              <p style="color: #4b5563; margin: 10px 0;">
                Please download and review the attached terms and conditions document for your property.
              </p>
              <div style="text-align: center; margin: 20px 0;">
                <a href="${termsPdfUrl}"
                   style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;"
                   download>
                  Download Terms & Conditions (PDF)
                </a>
              </div>
            </div>
          ` : ''}

          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>Important:</strong> Please review these terms and conditions carefully. If you have any questions or concerns, please contact us before proceeding.
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://sgslocations.com'}/contact"
               style="background-color: #6b7280; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Contact Us
            </a>
          </div>

          <p style="font-size: 14px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
            If you have any questions about these terms and conditions, please don't hesitate to reach out to our team.
          </p>

          <p style="font-size: 14px; color: #6b7280; margin-bottom: 0;">
            Best regards,<br>
            <strong>The SGS Locations Team</strong>
          </p>
        </div>

        <div style="text-align: center; margin-top: 20px; padding: 20px; color: #9ca3af; font-size: 12px;">
          <p>© ${new Date().getFullYear()} SGS Locations. All rights reserved.</p>
          <p style="margin: 5px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/contact" style="color: #9ca3af; text-decoration: none;">Contact Us</a> |
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/about" style="color: #9ca3af; text-decoration: none;">About</a>
          </p>
        </div>
      </body>
    </html>
  `;
}

// Helper functions for sending specific emails
export async function sendWelcomeEmail(userEmail: string, userName: string): Promise<boolean> {
  return sendEmail({
    to: userEmail,
    subject: 'Welcome to SGS Locations!',
    html: getWelcomeEmailTemplate(userName, userEmail)
  });
}

export async function sendPasswordResetEmail(
  userEmail: string,
  userName: string,
  resetLink: string
): Promise<boolean> {
  return sendEmail({
    to: userEmail,
    subject: 'Reset Your SGS Locations Password',
    html: getPasswordResetEmailTemplate(userName, resetLink)
  });
}

export async function sendPropertySubmissionEmail(
  userEmail: string,
  userName: string,
  propertyAddress: string
): Promise<boolean> {
  return sendEmail({
    to: userEmail,
    subject: 'Property Submission Received - SGS Locations',
    html: getPropertySubmissionEmailTemplate(userName, propertyAddress)
  });
}

export async function sendPropertyApprovalEmail(
  userEmail: string,
  userName: string,
  propertyName: string,
  propertyId: string
): Promise<boolean> {
  return sendEmail({
    to: userEmail,
    subject: 'Property Approved - SGS Locations',
    html: getPropertyApprovalEmailTemplate(userName, propertyName, propertyId)
  });
}

export async function sendPropertyRejectionEmail(
  userEmail: string,
  userName: string,
  propertyName: string,
  rejectionReason?: string
): Promise<boolean> {
  return sendEmail({
    to: userEmail,
    subject: 'Property Submission Update - SGS Locations',
    html: getPropertyRejectionEmailTemplate(userName, propertyName, rejectionReason)
  });
}

export async function sendPropertyTermsEmail(
  userEmail: string,
  userName: string,
  propertyName: string,
  termsType: 'text' | 'pdf',
  termsContent?: string,
  termsPdfUrl?: string
): Promise<boolean> {
  return sendEmail({
    to: userEmail,
    subject: 'Terms and Conditions - SGS Locations',
    html: getPropertyTermsEmailTemplate(userName, propertyName, termsType, termsContent, termsPdfUrl)
  });
}
