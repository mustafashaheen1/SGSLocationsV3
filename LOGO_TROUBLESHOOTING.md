# Logo Not Showing - Troubleshooting Guide

## Issue
Logo uploaded from admin panel but not showing on the website.

## Potential Causes & Solutions

### 1. **Database Migration Not Applied** ⚠️ MOST LIKELY
The migration file `20260112000001_allow_public_logo_access.sql` might not have been run.

**Solution:**
Run this SQL in your Supabase SQL Editor:

```sql
-- Check if the policy exists
SELECT * FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'app_settings'
AND policyname = 'Allow public read access to site logo';

-- If the above returns no rows, run this:
CREATE POLICY "Allow public read access to site logo"
  ON app_settings
  FOR SELECT
  TO public
  USING (setting_key = 'site_logo_url');
```

### 2. **Check if Logo URL is Saved**
Run this in Supabase SQL Editor to verify the logo URL is saved:

```sql
SELECT setting_key, setting_value
FROM app_settings
WHERE setting_key = 'site_logo_url';
```

If this returns a row with a URL, the logo is saved correctly.

### 3. **RLS Policy Issues**
The `app_settings` table might have RLS enabled but no public read policy.

**Check RLS Status:**
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'app_settings';
```

**If RLS is enabled (rowsecurity = true), ensure the public read policy exists:**
```sql
-- List all policies for app_settings
SELECT * FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'app_settings';
```

### 4. **Browser Cache Issue**
After fixing the database issue, you might need to:
- Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
- Clear browser cache
- Open an incognito/private window

### 5. **Invalid Image URL**
The uploaded image URL might be incorrect or the image might not be accessible.

**Check the URL:**
1. Go to Admin > Settings
2. Copy the logo URL
3. Open it in a new browser tab
4. If it doesn't load, the S3 upload might have failed

### 6. **S3 Permissions Issue**
The uploaded image might not have public read permissions.

**Verify S3 Settings:**
- Bucket should allow public reads for uploaded images
- Check your S3 bucket policy or CloudFront settings

## Quick Fix Script

Run this in your browser console while on the website to debug:

```javascript
// Check if logo is being fetched
const { createClient } = await import('@supabase/supabase-js');
const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SUPABASE_ANON_KEY'
);

const { data, error } = await supabase
  .from('app_settings')
  .select('setting_value')
  .eq('setting_key', 'site_logo_url')
  .maybeSingle();

console.log('Logo data:', data);
console.log('Logo error:', error);
```

## Expected Behavior

When working correctly:
1. Admin uploads logo in Settings page
2. Logo URL is saved to `app_settings` table
3. Navbar component fetches logo URL on page load
4. Logo displays in the navigation bar
5. If logo fails to load, falls back to "SGS LOCATIONS®" text

## Files Involved

- **Admin Settings:** `/app/admin/settings/page.tsx` (lines 224-272)
- **Navbar Component:** `/components/navbar.tsx` (lines 81-95, 177-191)
- **Migration File:** `/supabase/migrations/20260112000001_allow_public_logo_access.sql`
- **API Endpoint:** `/app/api/admin/settings/route.ts`

## Recommended Fix Order

1. ✅ Run the SQL policy creation (Solution #1)
2. ✅ Verify logo URL exists in database (Solution #2)
3. ✅ Hard refresh the website
4. ✅ Check image URL accessibility (Solution #5)
5. ✅ Clear browser cache if needed
