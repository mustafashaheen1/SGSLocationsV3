# Projects Feature Setup Guide

This guide walks you through setting up the new Projects feature for the portfolio page.

## Overview

The portfolio page now displays **Projects** instead of directly showing all properties. Each project has:
- **Name**: e.g., "Billi Ellish - WSJ - Mid Century Exotic"
- **Banner Image**: A specific image for the project
- **Linked Property**: One of your existing properties/locations
- **Display Order**: Controls the order projects appear on the portfolio page
- **Status**: Active or Inactive

## Step 1: Run Database Migration

The projects table needs to be created in your Supabase database.

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file: `supabase/migrations/20251120000000_create_projects_table.sql`
4. Copy the entire SQL content
5. Paste into Supabase SQL Editor and click **Run**

### Option B: Using Supabase CLI

```bash
supabase db push
```

This will apply all pending migrations including the projects table.

## Step 2: Generate INSERT Statements for Initial Data

You have two options to populate the projects table:

### Option A: Using the Generator Script (Recommended)

1. **Get your Property IDs from Supabase:**

   Run this query in Supabase SQL Editor:
   ```sql
   SELECT id, name, city FROM properties WHERE status = 'active' ORDER BY name;
   ```

   Copy the IDs into a JSON array format:
   ```javascript
   ['uuid-1', 'uuid-2', 'uuid-3', ...]
   ```

2. **Update the script:**

   Edit `scripts/generate-project-inserts.js`:
   - Paste your property IDs into the `PROPERTY_IDS` array
   - Paste your HTML source code into the `HTML_CONTENT` variable
   - Adjust the `extractProjectsFromHTML` function if needed to match your HTML structure

3. **Run the script:**

   ```bash
   node scripts/generate-project-inserts.js
   ```

4. **Copy and run the generated SQL:**

   The script will output INSERT statements. Copy them and run in Supabase SQL Editor.

### Option B: Manual Entry via Admin Panel

1. Start your Next.js development server:
   ```bash
   npm run dev
   ```

2. Navigate to the admin panel:
   ```
   http://localhost:3000/admin/projects
   ```

3. Use the form to manually add each project:
   - Enter project name
   - Enter banner image URL
   - Select a property from the dropdown
   - Set display order (lower numbers appear first)
   - Choose status (active/inactive)

## Step 3: Verify the Setup

### Check Portfolio Page

1. Navigate to: `http://localhost:3000/portfolio`
2. You should see your projects displayed in a grid
3. Hover over each project to see the name and "Visit Location" button
4. Click to navigate to the linked property page

### Check Admin Panel

1. Navigate to: `http://localhost:3000/admin/projects`
2. Verify all projects are listed
3. Test editing a project
4. Test deleting a project (use caution!)
5. Test creating a new project with file upload:
   - Upload a banner image (max 5MB)
   - Images are automatically uploaded to S3 in the `projects/` folder
   - Or enter an image URL directly
   - Preview shows before saving

## Database Schema

The `projects` table structure:

```sql
CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  banner_image text NOT NULL,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  display_order integer DEFAULT 0,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

## Security & Permissions

- **Public Read**: Anyone can view active projects (status = 'active')
- **Authenticated Write**: Only authenticated users can create, update, or delete projects
- **RLS Enabled**: Row Level Security is enabled for data protection

## S3 Image Upload

The admin panel supports automatic image uploads to your configured S3 bucket.

### Required Environment Variables

Ensure these are set in your `.env.local` file:

```env
NEXT_PUBLIC_AWS_REGION=us-west-1
NEXT_PUBLIC_AWS_ACCESS_KEY_ID=your-access-key
NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY=your-secret-key
NEXT_PUBLIC_AWS_S3_BUCKET=your-bucket-name
NEXT_PUBLIC_CLOUDFRONT_URL=your-cloudfront-url (optional)
```

### Upload Features

- **File Upload**: Drag and drop or select image files
- **File Validation**:
  - Accepts image files only (JPG, PNG, WebP, etc.)
  - Maximum file size: 5MB
- **Auto S3 Upload**: Files are automatically uploaded to `projects/` folder in your S3 bucket
- **Preview**: See image preview before saving
- **URL Option**: Can also paste image URLs directly instead of uploading
- **Progress Feedback**: Shows upload status and completion

## Example SQL INSERT

If you prefer to manually create SQL INSERT statements:

```sql
INSERT INTO projects (name, banner_image, property_id, display_order, status) VALUES
('Billi Ellish - WSJ - Mid Century Exotic', 'https://imagelocations-laravel.s3.us-west-1.amazonaws.com/banner1.jpg', 'your-property-uuid', 1, 'active'),
('Project Name 2', 'https://imagelocations-laravel.s3.us-west-1.amazonaws.com/banner2.jpg', 'your-property-uuid', 2, 'active'),
('Project Name 3', 'https://imagelocations-laravel.s3.us-west-1.amazonaws.com/banner3.jpg', 'your-property-uuid', 3, 'active');
```

## Troubleshooting

### Projects Not Showing on Portfolio Page

- Check that projects have `status = 'active'`
- Verify the `property_id` references a valid property
- Check browser console for errors

### Admin Panel Not Working

- Ensure you're authenticated (logged in)
- Check RLS policies in Supabase
- Verify the migration was run successfully

### Images Not Loading

- Verify image URLs are accessible
- Check CORS settings if images are from external sources
- Consider using Next.js Image optimization settings

## File Structure

```
/app/portfolio/page.tsx           - Portfolio page (displays projects)
/app/admin/projects/page.tsx      - Admin panel for managing projects
/lib/supabase.ts                  - Supabase client and Project type definition
/supabase/migrations/
  └── 20251120000000_create_projects_table.sql  - Creates projects table
  └── 20251120000001_seed_projects.sql          - Template for seeding data
/scripts/
  └── generate-project-inserts.js - Helper script to generate INSERT statements
```

## Next Steps

1. ✅ Run the migration to create the projects table
2. ✅ Generate and run INSERT statements to populate initial data
3. ✅ Verify projects display correctly on portfolio page
4. ✅ Test admin panel functionality
5. 🔄 Deploy to production when ready

## Need Help?

- Check Supabase logs for database errors
- Check browser console for frontend errors
- Verify environment variables are set correctly
- Ensure all migrations have been applied
