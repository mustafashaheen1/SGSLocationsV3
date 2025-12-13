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
