# How to Extend Admin Session Duration

Your admin session is expiring too quickly because of Supabase's default JWT token settings. Here's how to fix it:

## 🎯 Current Settings (Default)
- **Access Token (JWT) Expiry**: 1 hour (3600 seconds)
- **Refresh Token Expiry**: 7 days

## ✅ Solution: Extend Session Duration in Supabase

### Step 1: Open Supabase Dashboard
1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click on **"Authentication"** in the left sidebar
4. Click on **"Configuration"** tab

### Step 2: Update JWT Settings
1. Scroll down to **"JWT Settings"** section
2. Find **"JWT expiry limit"**
3. Change the value:
   - **Recommended**: `86400` (24 hours / 1 day)
   - **Very Long**: `604800` (7 days)
   - **Maximum**: `2592000` (30 days)

### Step 3: Update Refresh Token Settings
1. In the same Configuration page
2. Find **"Refresh Token Settings"**
3. Set **"Refresh token lifetime"**:
   - **Recommended**: `2592000` (30 days)
   - **Very Long**: `15552000` (180 days / 6 months)

### Step 4: Save Changes
1. Click **"Save"** at the bottom
2. The changes take effect immediately

## 📊 Recommended Settings for Admin Panel

For an admin panel where you don't want to be logged out frequently:

```
JWT Expiry: 86400 seconds (24 hours)
Refresh Token Lifetime: 2592000 seconds (30 days)
```

This means:
- ✅ You stay logged in for 24 hours without any action
- ✅ As long as you use the admin panel within 30 days, your session auto-refreshes
- ✅ After 30 days of inactivity, you'll need to log in again

## 🔄 How Auto-Refresh Works

Your app already has auto-refresh enabled (in `lib/supabase.ts`):
```typescript
auth: {
  persistSession: true,      // Saves session to localStorage
  autoRefreshToken: true,     // Automatically refreshes when needed
}
```

This means:
1. When your JWT expires (after 24 hours)
2. Supabase automatically uses the refresh token to get a new JWT
3. You stay logged in without interruption
4. This continues working as long as the refresh token is valid (30 days)

## 🎛️ Alternative: Environment-Specific Settings

If you want different settings for different environments:

**For Development** (longer sessions):
```
JWT Expiry: 604800 (7 days)
Refresh Token: 15552000 (180 days)
```

**For Production** (more secure):
```
JWT Expiry: 86400 (24 hours)
Refresh Token: 2592000 (30 days)
```

## ⚠️ Security Note

Longer session times = less secure but more convenient
- Use longer sessions for trusted admin users
- Use shorter sessions for public-facing authentication
- Always use HTTPS in production
- Consider IP allowlisting for extra security

## 🧪 Testing

After changing the settings:
1. Log out of the admin panel
2. Log back in
3. Leave the admin panel open
4. Come back after a few hours
5. You should still be logged in ✅

---

**Current Status**: Your client code is already configured correctly with `autoRefreshToken: true` and `persistSession: true`. You only need to adjust the Supabase dashboard settings!
