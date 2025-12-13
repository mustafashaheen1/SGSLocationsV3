# SGS Locations

Dallas Fort Worth's largest location database connecting property owners with production companies.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in the required values:

```bash
cp .env.example .env.local
```

#### Required Environment Variables

**Supabase Configuration**
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (server-side only)

**Site Configuration**
- `NEXT_PUBLIC_SITE_URL` - Your site URL (e.g., `http://localhost:3000` for development)

**AWS S3 Configuration**
- `AWS_ACCESS_KEY_ID` - Your AWS access key ID
- `AWS_SECRET_ACCESS_KEY` - Your AWS secret access key
- `AWS_REGION` - Your AWS region (e.g., `us-east-1`)
- `AWS_S3_BUCKET` - Your S3 bucket name

**SendGrid Configuration** (for transactional emails)
- `SENDGRID_API_KEY` - Your SendGrid API key
- `SENDGRID_FROM_EMAIL` - The email address to send from (e.g., `noreply@sgslocations.com`)
- `SENDGRID_FROM_NAME` - The name to display in sent emails (e.g., `SGS Locations`)

#### Optional Environment Variables

- `SMUGMUG_API_KEY` - SmugMug API key (if using SmugMug integration)
- `SMUGMUG_API_SECRET` - SmugMug API secret
- `SMUGMUG_USER_TOKEN` - SmugMug user token
- `SMUGMUG_USER_SECRET` - SmugMug user secret
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Google Maps API key (for maps features)
- `ANTHROPIC_API_KEY` - Anthropic API key (for AI features)

### 3. SendGrid Setup

SGS Locations uses SendGrid for sending transactional emails including:
- Welcome emails when users register
- Password reset emails

To set up SendGrid:

1. Create a SendGrid account at https://sendgrid.com
2. Generate an API key from the SendGrid dashboard
3. Verify your sender email address in SendGrid
4. Add the following to your `.env.local`:

```env
SENDGRID_API_KEY=your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=SGS Locations
```

**Note**: The `SENDGRID_FROM_EMAIL` must be a verified sender in your SendGrid account.

### 4. Database Setup

Run the Supabase migrations to set up your database schema:

```bash
# If you have Supabase CLI installed and linked
npx supabase db push

# Or manually run the migrations via Supabase dashboard
# Navigate to SQL Editor and run migrations from /supabase/migrations/
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

- Property listings with advanced search
- User authentication and profiles
- Admin panel for content management
- Image and video uploads to S3
- Email notifications via SendGrid
- SmugMug integration for photo galleries
- Saved searches and favorites
- Property inquiries
- Calendar management for bookings

## Tech Stack

- Next.js 14+ (App Router)
- React
- TypeScript
- Supabase (Authentication & Database)
- Tailwind CSS
- SendGrid (Email)
- AWS S3 (File Storage)

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── admin/             # Admin panel pages
│   ├── api/               # API routes
│   └── ...                # Public pages
├── components/            # React components
├── lib/                   # Utility functions and configurations
│   ├── supabase.ts       # Supabase client setup
│   ├── sendgrid.ts       # SendGrid email integration
│   └── ...
├── supabase/
│   └── migrations/       # Database migrations
└── public/               # Static assets
```

## Email Templates

Email templates are defined in `/lib/sendgrid.ts`:

- `getWelcomeEmailTemplate()` - Welcome email for new users
- `getPasswordResetEmailTemplate()` - Password reset email

Templates are fully branded with SGS Locations styling.

## License

All rights reserved.
