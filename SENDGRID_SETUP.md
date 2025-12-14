# SendGrid Email Integration

This document describes the SendGrid email integration implemented in the SGS Locations application.

## Overview

The application uses SendGrid for sending transactional emails to users. Six types of emails are currently implemented:

1. **Welcome Email** - Sent when a new user registers
2. **Password Reset Email** - Sent when a user requests a password reset
3. **Property Submission Confirmation Email** - Sent when a property owner submits a property listing
4. **Property Approval Email** - Sent when an admin approves a property listing
5. **Property Rejection Email** - Sent when an admin rejects a property listing
6. **Property Terms & Conditions Email** - Sent by admin to send property-specific terms and conditions to property owner

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
- **`/app/api/send-property-submission-email/route.ts`** - API endpoint for sending property submission confirmation emails
- **`/app/api/send-property-approval-email/route.ts`** - API endpoint for sending property approval emails
- **`/app/api/send-property-rejection-email/route.ts`** - API endpoint for sending property rejection emails
- **`/app/api/send-property-terms-email/route.ts`** - API endpoint for sending property-specific terms and conditions

### Frontend Integration
- **`/app/register/page.tsx`** - Updated to send welcome email after successful registration
- **`/app/forgot-password/page.tsx`** - Updated to use SendGrid API route instead of Supabase's built-in email
- **`/app/list-your-property/page.tsx`** - Updated to send property submission confirmation email after successful property submission
- **`/app/admin/properties/pending/page.tsx`** - Updated to send approval/rejection emails when admin approves or rejects properties
- **`/app/admin/properties/[id]/edit/page.tsx`** - Added Terms & Conditions tab for sending property-specific terms to property owners

### Infrastructure
- **`/lib/supabase.ts`** - Added `createAdminClient()` function for server-side admin operations
- **`.env.example`** - Added SendGrid environment variable examples
- **`README.md`** - Added comprehensive SendGrid setup instructions
- **`/supabase/migrations/20251214000001_add_property_terms.sql`** - Database migration to add terms and conditions fields to properties table

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
3. Server checks if user exists in the database
4. If user doesn't exist:
   - Returns 404 error
   - User sees "No account found with this email address"
5. If user exists:
   - Supabase admin client generates a secure password reset link using `admin.generateLink()`
   - SendGrid sends branded password reset email with the link
   - User sees success message
6. User clicks link in email and is taken to reset password page
7. User enters new password and submits

**Security Features:**
- Password reset links are one-time use and expire after 1 hour
- Uses Supabase's secure token generation with admin API
- Email validation before sending

**Note:** The system now returns an error if the email doesn't exist, improving user experience by providing immediate feedback.

### Property Submission Confirmation Flow

1. User fills out property listing form at `/list-your-property`
2. User submits the form (either logged in or as guest)
3. Property is uploaded to S3 and saved to database with status "pending"
4. API call is made to `/api/send-property-submission-email` with owner's email, name, and property address
5. SendGrid sends branded confirmation email to property owner
6. User is redirected to dashboard

**Note:** Property submission is not blocked if the email fails to send (graceful degradation)

### Property Approval Flow

1. Admin navigates to `/admin/properties/pending`
2. Admin reviews the pending property listing
3. Admin clicks "Approve" button
4. System fetches property details and owner information
5. Property status is updated to "active" in database
6. API call is made to `/api/send-property-approval-email` with owner's email, name, property name, and property ID
7. SendGrid sends branded approval email to property owner
8. Property is now visible in the location database

**Note:** Property approval is not blocked if the email fails to send (graceful degradation)

### Property Rejection Flow

1. Admin navigates to `/admin/properties/pending`
2. Admin reviews the pending property listing
3. Admin clicks "Reject" button
4. System prompts admin for optional rejection reason
5. System fetches property details and owner information
6. Property status is updated to "inactive" in database
7. API call is made to `/api/send-property-rejection-email` with owner's email, name, property name, and optional rejection reason
8. SendGrid sends branded rejection email to property owner (includes reason if provided)

**Note:** Property rejection is not blocked if the email fails to send (graceful degradation)

### Property Terms & Conditions Flow

1. Admin navigates to `/admin/properties/[id]/edit` for a specific property
2. Admin clicks on "Terms & Conditions" tab
3. System displays property owner information (name and email)
4. If terms have been previously sent, system displays:
   - Date and time when terms were sent
   - Type of terms (text or PDF)
   - Content preview (for text) or PDF download link
5. Admin selects terms format:
   - **Text Content:** Write terms directly in a text area
   - **PDF Document:** Upload a PDF file containing the terms
6. Admin enters content or uploads PDF:
   - For text: enters terms and conditions in the provided text area
   - For PDF: selects PDF file from computer (uploaded to S3)
7. Admin clicks "Send Terms & Conditions"
8. System confirms the action with the owner's email
9. If PDF selected: file is uploaded to S3 first
10. API call is made to `/api/send-property-terms-email` with property ID, terms type, and content/PDF URL
11. Property record is updated in database with:
    - `terms_type`: 'text' or 'pdf'
    - `terms_content`: text content (if applicable)
    - `terms_pdf_url`: S3 URL (if applicable)
    - `terms_sent_at`: current timestamp
    - `terms_sent_by`: admin user ID
12. SendGrid sends branded email to property owner with terms and conditions
13. Admin receives success confirmation
14. Page refreshes to show newly sent terms

**Key Features:**
- Property-specific terms (different for each owner)
- Flexible format (text or PDF)
- Audit trail (who sent, when sent)
- PDF files uploaded to S3 with secure URLs
- Can send updated terms multiple times
- Only available for properties with assigned owners

**Note:** Email sending is not blocked if it fails (graceful degradation)

## Email Templates

All email templates are fully branded with SGS Locations colors and styling:

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

### Property Submission Confirmation Email Includes:
- Personalized greeting with property owner's name
- Confirmation of submission receipt
- Property details (address and status)
- "What Happens Next?" section with review timeline
- "View Dashboard" call-to-action button
- Important note about tracking submission status

### Property Approval Email Includes:
- Celebratory header with green color scheme
- Personalized greeting with property owner's name
- Confirmation that property is now live
- Property details (name and active status)
- "What This Means" section explaining visibility and inquiries
- Tip about responding to inquiries promptly
- "View Property" and "Go to Dashboard" call-to-action buttons

### Property Rejection Email Includes:
- Professional header with red color scheme
- Personalized greeting with property owner's name
- Polite explanation of rejection
- Property details (name and status)
- Optional rejection reason (if provided by admin)
- "What You Can Do" section with next steps
- "Submit New Listing" and "Contact Support" call-to-action buttons
- Supportive note encouraging resubmission

### Property Terms & Conditions Email Includes:
- Professional header with blue color scheme
- Personalized greeting with property owner's name
- Introduction explaining purpose of email
- Property information (property name)
- **For Text Type:**
  - Full text content of terms and conditions displayed in email
  - Formatted with proper spacing and readability
- **For PDF Type:**
  - "Download Terms & Conditions" call-to-action button
  - Direct download link to PDF stored on S3
- Important notice section
- "Contact Support" call-to-action button for questions
- Professional footer with copyright

## Testing

### Test Welcome Email

Register a new user account through the registration form. Check your inbox for the welcome email.

### Test Password Reset Email

1. Go to `/forgot-password`
2. Enter your email address
3. Check your inbox for the password reset email
4. Click the reset link and verify it takes you to the password reset page

### Test Property Submission Confirmation Email

1. Go to `/list-your-property`
2. Fill out the property listing form with all required information
3. Upload property images
4. Submit the form (login if prompted)
5. Check your inbox for the property submission confirmation email
6. Verify email includes property address and submission details

### Test Property Approval Email

1. Submit a test property (following steps above)
2. Login to admin panel at `/admin/login`
3. Navigate to `/admin/properties/pending`
4. Click "Approve" on the test property
5. Check the property owner's inbox for the approval email
6. Verify email includes property name and links to view the property

### Test Property Rejection Email

1. Submit a test property (following steps above)
2. Login to admin panel at `/admin/login`
3. Navigate to `/admin/properties/pending`
4. Click "Reject" on the test property
5. Enter an optional rejection reason when prompted (e.g., "Images quality needs improvement")
6. Check the property owner's inbox for the rejection email
7. Verify email includes property name and rejection reason (if provided)

### Test Property Terms & Conditions Email

**Prerequisites:** You need a property with an assigned owner (not an admin-owned property)

**Test Text Format:**
1. Login to admin panel at `/admin/login`
2. Navigate to any property with an owner: `/admin/properties/[id]/edit`
3. Click on "Terms & Conditions" tab
4. Verify property owner information is displayed
5. Ensure "Text Content" option is selected
6. Enter sample terms and conditions in the text area (e.g., "By using this property, you agree to...")
7. Click "Send Terms & Conditions"
8. Confirm the action when prompted
9. Check the property owner's inbox for the terms email
10. Verify email includes the text content you entered
11. Refresh the page and verify previously sent terms are displayed

**Test PDF Format:**
1. Follow steps 1-4 above
2. Select "PDF Document" option
3. Click to upload and select a PDF file containing terms and conditions
4. Verify the file name is displayed after selection
5. Click "Send Terms & Conditions"
6. Confirm the action when prompted
7. Wait for upload and email sending to complete
8. Check the property owner's inbox for the terms email
9. Verify email includes a download link for the PDF
10. Click the PDF link and verify it downloads the correct file
11. Refresh the page and verify previously sent terms show PDF download option

**Test No Owner Scenario:**
1. Navigate to an admin-owned property (property without owner_id)
2. Click on "Terms & Conditions" tab
3. Verify amber warning message is displayed
4. Verify send form is not available

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
