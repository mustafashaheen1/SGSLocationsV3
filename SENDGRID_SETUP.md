# SendGrid Email Integration

This document describes the SendGrid email integration implemented in the SGS Locations application.

## Overview

The application uses SendGrid for sending transactional emails to users. Two types of emails are currently implemented:

1. **Welcome Email** - Sent when a new user registers
2. **Password Reset Email** - Sent when a user requests a password reset

## Files Modified/Created

### Core Email Module
- **`/lib/sendgrid.ts`** - Main SendGrid integration module containing:
  - `sendEmail()` - Core email sending function
  - `getWelcomeEmailTemplate()` - HTML template for welcome emails
  - `getPasswordResetEmailTemplate()` - HTML template for password reset emails
  - `sendWelcomeEmail()` - Helper function for welcome emails
  - `sendPasswordResetEmail()` - Helper function for password reset emails

### API Routes
- **`/app/api/send-welcome-email/route.ts`** - API endpoint for sending welcome emails
- **`/app/api/send-password-reset-email/route.ts`** - API endpoint for sending password reset emails

### Frontend Integration
- **`/app/register/page.tsx`** - Updated to send welcome email after successful registration
- **`/app/forgot-password/page.tsx`** - Updated to use SendGrid API route instead of Supabase's built-in email

### Infrastructure
- **`/lib/supabase.ts`** - Added `createAdminClient()` function for server-side admin operations
- **`.env.example`** - Added SendGrid environment variable examples
- **`README.md`** - Added comprehensive SendGrid setup instructions

## Environment Variables Required

Add these to your `.env.local` file:

```env
SENDGRID_API_KEY=your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=SGS Locations
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

**Important Notes:**
- `SENDGRID_FROM_EMAIL` must be a verified sender in your SendGrid account
- `SUPABASE_SERVICE_ROLE_KEY` is required for generating password reset links without sending Supabase's default email

## How It Works

### Welcome Email Flow

1. User submits registration form at `/register`
2. User account is created in Supabase Auth
3. User profile is created in the `users` table
4. API call is made to `/api/send-welcome-email` with user's email and name
5. SendGrid sends branded welcome email to user
6. User is redirected to dashboard

**Note:** Registration is not blocked if the email fails to send (graceful degradation)

### Password Reset Flow

1. User submits email at `/forgot-password`
2. API call is made to `/api/send-password-reset-email`
3. Server checks if user exists (doesn't reveal if user exists for security)
4. If user exists:
   - Supabase admin client generates a secure password reset link using `admin.generateLink()`
   - SendGrid sends branded password reset email with the link
5. User clicks link in email and is taken to reset password page
6. User enters new password and submits

**Security Features:**
- Always returns "success" message even if email doesn't exist (prevents user enumeration)
- Password reset links are one-time use and expire after 1 hour
- Uses Supabase's secure token generation with admin API

## Email Templates

Both email templates are fully branded with SGS Locations colors and styling:

- **Primary Color:** #DC2626 (Red)
- **Responsive Design:** Mobile-friendly HTML emails
- **Professional Layout:** Header, content sections, call-to-action buttons, footer

### Welcome Email Includes:
- Personalized greeting with user's name
- Confirmation of email address
- What's next section with platform features
- "Explore Properties" call-to-action button
- Footer with copyright and links

### Password Reset Email Includes:
- Personalized greeting
- Security warning about link expiration (1 hour)
- "Reset Password" call-to-action button
- Fallback text link for email clients that don't support buttons
- "Didn't request this?" security notice

## Testing

### Test Welcome Email

Register a new user account through the registration form. Check your inbox for the welcome email.

### Test Password Reset Email

1. Go to `/forgot-password`
2. Enter your email address
3. Check your inbox for the password reset email
4. Click the reset link and verify it takes you to the password reset page

## Troubleshooting

### Email Not Sending

1. **Check SendGrid API Key:** Verify the API key is correct in `.env.local`
2. **Check Sender Verification:** Ensure `SENDGRID_FROM_EMAIL` is verified in SendGrid dashboard
3. **Check Logs:** Look for error messages in the console or server logs
4. **Check SendGrid Dashboard:** View email activity and delivery status

### Password Reset Not Working

1. **Check Service Role Key:** Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly
2. **Check Supabase Settings:** Ensure password reset is enabled in Supabase Auth settings
3. **Check Link Expiration:** Password reset links expire after 1 hour

## Future Enhancements

Potential email types to add in the future:

- Inquiry received confirmation (for property owners)
- Inquiry submitted confirmation (for producers)
- Property approval/rejection notifications
- Saved search result updates
- Booking confirmations
- Monthly newsletter

## Security Considerations

1. **API Keys:** Never commit `.env.local` to version control
2. **Service Role Key:** Only use in server-side API routes, never expose to client
3. **Email Validation:** Always validate email addresses before sending
4. **Rate Limiting:** Consider implementing rate limiting on email endpoints to prevent abuse
5. **User Enumeration Prevention:** Password reset always returns success to prevent discovering valid emails

## Cost Management

SendGrid pricing is based on email volume:
- **Free Tier:** 100 emails/day
- **Essentials:** $19.95/month for 50,000 emails/month
- **Pro:** $89.95/month for 1.5M emails/month

Monitor your email sending volume in the SendGrid dashboard and upgrade your plan as needed.
