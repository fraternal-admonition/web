# Google OAuth Setup Guide

## ✅ What's Been Implemented

All UI and code for Google OAuth has been implemented:

- ✅ Google sign-in button on `/auth/signin`
- ✅ Google sign-up button on `/auth/signup`
- ✅ Auto-creates `public.users` profile for OAuth users
- ✅ Redesigned auth pages with better layout
- ✅ Fixed navbar positioning and styling issues
- ✅ Fixed sign out button functionality

---

## 🔧 Required Setup Steps

### 1. Google Cloud Console Setup

You need to configure Google OAuth in Google Cloud Console:

#### A. Create a Project (if you don't have one)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one

#### B. Enable Google+ API

1. In your project, go to **APIs & Services** > **Library**
2. Search for "Google+ API"
3. Click and Enable it

#### C. Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Choose **External** (unless you have a Google Workspace)
3. Fill in required fields:
   - **App name**: Fraternal Admonition
   - **User support email**: Your email
   - **Developer contact email**: Your email
4. Add scopes (optional for now):
   - `userinfo.email`
   - `userinfo.profile`
5. Add test users if in testing mode
6. Save and continue

#### D. Create OAuth 2.0 Client ID

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth Client ID**
3. Choose **Web application**
4. Configure:
   - **Name**: Fraternal Admonition Web Client
   - **Authorized JavaScript origins**:
     ```
     http://localhost:3000
     ```
   - **Authorized redirect URIs**:
     ```
     http://localhost:3000/auth/callback
     https://mlbhsippcnzeybheudhu.supabase.co/auth/v1/callback
     ```
     _(Use your actual Supabase project URL)_
5. Click **Create**
6. **IMPORTANT**: Copy the **Client ID** and **Client Secret** - you'll need these!

---

### 2. Supabase Configuration

#### A. Enable Google Provider in Supabase

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to **Authentication** > **Providers**
4. Find **Google** and click to configure
5. Enable the Google provider
6. Enter your Google OAuth credentials:
   - **Client ID**: (from Google Cloud Console)
   - **Client Secret**: (from Google Cloud Console)
7. Click **Save**

#### B. Configure Redirect URLs (if not already done)

1. In Supabase, go to **Authentication** > **URL Configuration**
2. Add to **Redirect URLs**:
   ```
   http://localhost:3000/auth/callback
   ```
   For production, also add:
   ```
   https://yourdomain.com/auth/callback
   ```

---

### 3. Environment Variables

You **DO NOT** need to add any new environment variables! The Google OAuth credentials are stored in Supabase, not in your `.env.local`.

Your existing environment variables should already have:

```env
NEXT_PUBLIC_SUPABASE_URL=https://mlbhsippcnzeybheudhu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RESEND_API_KEY=your-resend-key
EMAIL_FROM=your-email-from
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## 🧪 Testing Google OAuth

### 1. Start your dev server

```bash
npm run dev
```

### 2. Test Sign Up with Google

1. Go to http://localhost:3000/auth/signup
2. Click **"Continue with Google"**
3. You'll be redirected to Google login
4. Sign in with a Google account
5. Grant permissions
6. You'll be redirected back to `/dashboard`

### 3. Verify Database

Check that the user was created in both:

- ✅ `auth.users` table (Supabase Auth)
- ✅ `public.users` table (Your app's profile)

You can verify by running this query in Supabase SQL Editor:

```sql
SELECT
  au.id,
  au.email,
  au.raw_user_meta_data->>'full_name' as google_name,
  pu.role,
  pu.is_banned,
  pu.created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'your-test-google-email@gmail.com';
```

### 4. Test Sign In with Google

1. Sign out first
2. Go to http://localhost:3000/auth/signin
3. Click **"Continue with Google"**
4. Should redirect directly to dashboard (if already authorized)

---

## 🔍 How It Works

### Flow for New Google Users:

1. User clicks "Continue with Google"
2. Redirected to Google OAuth consent screen
3. User grants permissions
4. Google redirects back to `/auth/callback?code=...`
5. Callback route:
   - Exchanges code for session
   - Checks if `public.users` profile exists
   - **If not exists**: Creates profile with `role: USER`, `is_banned: false`
   - **If exists**: Continues normally
6. Sends welcome email (non-blocking)
7. Redirects to `/dashboard`

### Flow for Returning Google Users:

1. User clicks "Continue with Google"
2. Redirected to Google (may auto-consent if already authorized)
3. Back to `/auth/callback`
4. Profile already exists, so just logs in
5. Redirects to `/dashboard`

---

## 🎨 UI Changes Made

### Auth Pages (Sign In & Sign Up)

- ✅ Added padding-top (`pt-32`) to prevent navbar cutoff
- ✅ Added padding-bottom (`pb-20`) for breathing room
- ✅ Larger, more prominent headings
- ✅ Google button with official Google logo colors
- ✅ Divider with "Or sign in/up with email" text
- ✅ Enhanced hover states and transitions
- ✅ Better spacing and visual hierarchy
- ✅ Improved back button with icon

### Navbar (Logged In State)

- ✅ Better alignment and symmetry
- ✅ Email display with truncation
- ✅ Sign Out button styled as a proper button
- ✅ Cleaner spacing between elements
- ✅ Fixed gap issues in flex layout

### Sign Out Button

- ✅ Now properly calls `signOut()` from AuthContext
- ✅ Redirects to homepage after sign out
- ✅ Works on all pages (global navbar)

---

## 🔒 Security Notes

1. **Service Role Key**: Used only server-side to create profiles (bypasses RLS)
2. **Anon Key**: Used client-side for OAuth redirects (safe to expose)
3. **Google Credentials**: Stored in Supabase, never in your codebase
4. **Profile Creation**: Only happens in auth callback (server-side)

---

## 🐛 Troubleshooting

### "Error 400: redirect_uri_mismatch"

- Check that your Google OAuth redirect URIs match **exactly**:
  - In Google Console: `http://localhost:3000/auth/callback` AND `https://YOUR-PROJECT.supabase.co/auth/v1/callback`
  - No trailing slashes!

### "User not found in public.users"

- Check your database logs
- Verify service role key is correct in `.env.local`
- Check if profile was created: `SELECT * FROM public.users WHERE email = 'test@gmail.com';`

### "Sign Out button doesn't work"

- ✅ This is now fixed! Button now properly calls `signOut()` from AuthContext
- Should redirect to homepage after signing out

### "OAuth popup is blocked"

- Make sure popups are allowed for localhost
- Try using redirect instead (already configured)

### "Profile not showing admin badge"

- Admin badge only shows if `role = 'ADMIN'` in `public.users`
- Update user role: `UPDATE public.users SET role = 'ADMIN' WHERE email = 'your@email.com';`

---

## 🚀 Production Deployment

When deploying to production:

1. **Update Google OAuth redirect URIs**:
   - Add `https://yourdomain.com/auth/callback`
   - Add `https://YOUR-PROJECT.supabase.co/auth/v1/callback`

2. **Update Supabase Redirect URLs**:
   - Add `https://yourdomain.com/auth/callback`

3. **Update environment variable**:

   ```env
   NEXT_PUBLIC_SITE_URL=https://yourdomain.com
   ```

4. **Verify OAuth Consent Screen**:
   - If you used "Testing" mode, publish your app or add production users as test users

---

## ✅ Checklist

Before testing, make sure you've completed:

- [ ] Created Google Cloud Project
- [ ] Enabled Google+ API
- [ ] Configured OAuth Consent Screen
- [ ] Created OAuth 2.0 Client ID with correct redirect URIs
- [ ] Copied Client ID and Secret
- [ ] Enabled Google provider in Supabase
- [ ] Entered Google credentials in Supabase
- [ ] Added redirect URLs in Supabase URL Configuration
- [ ] Existing environment variables are correct
- [ ] Dev server is running (`npm run dev`)

---

**Ready to test Google OAuth! 🎉**
