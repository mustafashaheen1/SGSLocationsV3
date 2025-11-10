# SGS Locations - Backend Integration Guide

## ✅ Completed Components

### 1. Database Schema (/supabase/migrations/)
- ✅ `20251110000000_create_content_management.sql` - Content management tables created
  - `site_content` - Editable website content
  - `inquiries` - Property inquiries
  - `saved_searches` - User saved filters
  - `saved_properties` - User favorites
  - `users.is_admin` - Admin role tracking
  - Full RLS policies implemented

### 2. AWS S3 Upload Utility (/lib/s3-upload.ts)
- ✅ `uploadImageToS3()` - Single image upload
- ✅ `uploadMultipleImages()` - Batch upload
- ✅ `deleteImageFromS3()` - Image deletion
- CloudFront CDN support

### 3. Admin Authentication
- ✅ `/app/admin/login/page.tsx` - Real Supabase auth
- ✅ `/app/admin/layout.tsx` - Protected routes with admin check
- Checks `users.is_admin` flag
- Session management with Supabase

### 4. Admin Dashboard
- ✅ `/app/admin/dashboard/page.tsx` - Real-time stats
  - Total properties count
  - Pending properties count
  - Total users count
  - Pending inquiries count
  - Recent property activity

## 🚧 Components To Implement

### 5. Admin Properties Management
File: `/app/admin/properties/page.tsx`

```typescript
- List all properties with filters (all/active/pending/inactive)
- Approve/reject pending properties
- Toggle featured status
- Edit property details
- Delete properties
- View property details
```

### 6. Content Management System (CMS)
File: `/app/admin/content/page.tsx`

```typescript
- Edit homepage content (hero, stats, client logos)
- Edit about page content
- Edit contact page info
- JSON editor for complex content
```

### 7. Admin Users Management
File: `/app/admin/users/page.tsx`

```typescript
- List all users
- Toggle admin status
- View user details
- Delete users
- View user properties
```

### 8. Admin Inquiries Management
File: `/app/admin/inquiries/page.tsx`

```typescript
- List all inquiries
- Filter by status (pending/responded/archived)
- Respond to inquiries
- Add admin notes
```

### 9. Property Listing Form with S3
File: `/app/list-your-property/page.tsx`

Add S3 upload integration:
```typescript
import { uploadMultipleImages } from '@/lib/s3-upload';

// In handleSubmit:
let imageUrls: string[] = [];
if (uploadedFiles.length > 0) {
  imageUrls = await uploadMultipleImages(uploadedFiles, 'properties');
}

// Save to database with imageUrls
```

### 10. Homepage Dynamic Content
File: `/app/page.tsx`

```typescript
useEffect(() => {
  async function loadContent() {
    // Fetch featured properties
    const { data: featured } = await supabase
      .from('properties')
      .select('*')
      .eq('status', 'active')
      .eq('is_featured', true)
      .limit(6);

    // Fetch site content
    const { data: siteContent } = await supabase
      .from('site_content')
      .select('*')
      .eq('page', 'homepage');
  }
  loadContent();
}, []);
```

## 📋 Deployment Checklist

### Database Setup
1. ✅ Run migration: `20251110000000_create_content_management.sql`
2. ⚠️ Create admin user in Supabase Auth dashboard
3. ⚠️ Update user to admin:
   ```sql
   UPDATE users SET is_admin = true WHERE email = 'admin@sgslocations.com';
   ```

### Environment Variables (Vercel)
Already configured:
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `NEXT_PUBLIC_AWS_REGION`
- ✅ `NEXT_PUBLIC_AWS_ACCESS_KEY_ID`
- ✅ `NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY`
- ✅ `NEXT_PUBLIC_AWS_S3_BUCKET`
- ⚠️ `NEXT_PUBLIC_CLOUDFRONT_URL` (optional)

### Testing Steps
1. ⚠️ Test admin login with real credentials
2. ⚠️ Test property submission with image upload to S3
3. ⚠️ Test admin approval workflow
4. ⚠️ Test property search with filters
5. ⚠️ Test content management system

## 🔐 Security Notes

### RLS Policies Implemented
- ✅ `site_content` - Public read, admin write
- ✅ `inquiries` - Users see own, property owners see theirs, admins see all
- ✅ `saved_searches` - Users manage own only
- ✅ `saved_properties` - Users manage own only

### Admin Access
- Protected routes check `is_admin` flag
- Session validation on every admin page load
- Automatic logout if admin status revoked

## 📦 Dependencies

Already installed:
- `@aws-sdk/client-s3`
- `@aws-sdk/s3-request-presigner`
- `@supabase/supabase-js`
- All Radix UI components
- `lucide-react` for icons

## 🎯 Next Steps

1. **Run the migration** in Supabase dashboard
2. **Create admin user** and set `is_admin = true`
3. **Implement remaining admin pages** (properties, users, inquiries, content)
4. **Add S3 upload to property listing form**
5. **Update homepage with dynamic content**
6. **Test thoroughly** before production deployment

## 💡 Usage Examples

### Upload Image to S3
```typescript
import { uploadImageToS3 } from '@/lib/s3-upload';

const imageUrl = await uploadImageToS3(file, 'properties');
// Returns: https://cloudfront.url/properties/timestamp-random.jpg
```

### Check if User is Admin
```typescript
const { data: { session } } = await supabase.auth.getSession();
const { data: user } = await supabase
  .from('users')
  .select('is_admin')
  .eq('id', session.user.id)
  .single();

if (user?.is_admin) {
  // Show admin features
}
```

### Query Site Content
```typescript
const { data } = await supabase
  .from('site_content')
  .select('*')
  .eq('page', 'homepage')
  .eq('section', 'hero');
```

## 🐛 Troubleshooting

### Admin Login Issues
- Verify user exists in Supabase Auth
- Check `is_admin = true` in users table
- Clear browser localStorage
- Check browser console for errors

### S3 Upload Failures
- Verify AWS credentials in environment variables
- Check S3 bucket permissions (public-read ACL)
- Verify CORS configuration on S3 bucket
- Check file size limits

### Database Query Errors
- Run all migrations in order
- Check RLS policies are enabled
- Verify user authentication status
- Check Supabase logs for errors

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [AWS S3 SDK](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/s3-examples.html)
- [Next.js 13 Documentation](https://nextjs.org/docs)
- [Radix UI Components](https://www.radix-ui.com/)

---

**Note:** This is a comprehensive backend integration. Test each component individually before combining them all.
