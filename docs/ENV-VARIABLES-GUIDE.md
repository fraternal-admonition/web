# Environment Variables Guide

## 📋 Required Environment Variables

Add these to your `.env.local` file:

```env
# ============================================
# SUPABASE CONFIGURATION
# ============================================

# Supabase Project URL
# Get from: Supabase Dashboard > Settings > API > Project URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co

# Supabase Anon/Public Key
# Get from: Supabase Dashboard > Settings > API > Project API keys > anon/public
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase Service Role Key (⚠️ KEEP SECRET!)
# Get from: Supabase Dashboard > Settings > API > Project API keys > service_role
# This key bypasses Row Level Security - use only server-side!
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================
# RESEND EMAIL SERVICE
# ============================================

# Resend API Key
# Get from: https://resend.com/api-keys
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Email "From" Address
# Must be verified in Resend before sending emails
# Format: "Name <email@domain.com>"
EMAIL_FROM=Fraternal Admonition <noreply@yourdomain.com>

# ============================================
# SITE CONFIGURATION
# ============================================

# Site URL (used for email verification callbacks)
# Development:
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Production (when deploying):
# NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

---

## 🔒 Security Notes

### Public vs. Secret Keys

| Variable                        | Type       | Can Expose? | Where Used?     |
| ------------------------------- | ---------- | ----------- | --------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Public     | ✅ Yes      | Client & Server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public     | ✅ Yes      | Client & Server |
| `SUPABASE_SERVICE_ROLE_KEY`     | **SECRET** | ❌ **NO!**  | Server only     |
| `RESEND_API_KEY`                | **SECRET** | ❌ **NO!**  | Server only     |
| `EMAIL_FROM`                    | Public     | ✅ Yes      | Server only     |
| `NEXT_PUBLIC_SITE_URL`          | Public     | ✅ Yes      | Client & Server |

### Important:

- ⚠️ **NEVER** commit `.env.local` to git
- ⚠️ **NEVER** expose service role key in client-side code
- ⚠️ Always use `NEXT_PUBLIC_` prefix for client-accessible variables
- ⚠️ Keep `.env.local` in `.gitignore`

---

## 🌐 Google OAuth Credentials

**You DO NOT need Google credentials in `.env.local`!**

Google OAuth is configured in Supabase Dashboard:

1. Go to Supabase Dashboard
2. Authentication > Providers > Google
3. Enter Client ID and Client Secret there
4. Supabase handles the rest

---

## 🚀 Production Deployment

When deploying to production (Vercel, Netlify, etc.):

### 1. Add all environment variables to your hosting platform

- Copy all variables from `.env.local`
- Update `NEXT_PUBLIC_SITE_URL` to your production domain
- Update `EMAIL_FROM` to your production domain

### 2. Update Supabase Redirect URLs

Go to Supabase Dashboard > Authentication > URL Configuration:

```
https://yourdomain.com/auth/callback
```

### 3. Update Google OAuth Redirect URIs

Go to Google Cloud Console > APIs & Services > Credentials:

```
https://yourdomain.com/auth/callback
https://YOUR-PROJECT.supabase.co/auth/v1/callback
```

### 4. Verify Resend Domain

Add and verify your production domain in Resend dashboard.

---

## 🧪 Testing Your Configuration

### Check if variables are loaded:

Create `src/app/api/test-env/route.ts`:

```typescript
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    resendKey: !!process.env.RESEND_API_KEY,
    emailFrom: !!process.env.EMAIL_FROM,
    siteUrl: !!process.env.NEXT_PUBLIC_SITE_URL,
  });
}
```

Visit `http://localhost:3000/api/test-env` - all should be `true`.

### ⚠️ Remember to delete this test route after checking!

---

## 🐛 Troubleshooting

### "Invalid Supabase URL"

- Check `NEXT_PUBLIC_SUPABASE_URL` is correct
- Should start with `https://`
- Should end with `.supabase.co`
- No trailing slash

### "Invalid API Key"

- Check you copied the full key
- Anon key starts with `eyJhbG...`
- Service role key starts with `eyJhbG...`
- No extra spaces or line breaks

### "Email not sending"

- Check `RESEND_API_KEY` is valid
- Verify `EMAIL_FROM` domain in Resend
- Check Resend dashboard for errors

### "Redirect URI mismatch"

- Google OAuth is configured in Supabase, not `.env`
- Check redirect URIs in Google Console match exactly
- No trailing slashes!

### "Service role key not working"

- Make sure it's the **service_role** key, not anon key
- Check it's not being used in client-side code
- Verify it's in `.env.local`, not `.env`

---

## 📝 Example `.env.local`

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://mlbhsippcnzeybheudhu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sYmhzaXBwY256ZXliaGV1ZGh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODIwMDAwMDAsImV4cCI6MTk5NzU3NjAwMH0.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sYmhzaXBwY256ZXliaGV1ZGh1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY4MjAwMDAwMCwiZXhwIjoxOTk3NTc2MDAwfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Resend
RESEND_API_KEY=re_aBcDeFgHiJkLmNoPqRsTuVwXyZ123456
EMAIL_FROM=Fraternal Admonition <noreply@fraternaladmonition.com>

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## ✅ Checklist

Before starting the app, verify:

- [ ] Created `.env.local` file (not `.env`)
- [ ] Added all 6 required environment variables
- [ ] Copied correct Supabase URL from dashboard
- [ ] Copied correct anon key from dashboard
- [ ] Copied correct service role key from dashboard
- [ ] Added valid Resend API key
- [ ] Set correct email "from" address
- [ ] Set correct site URL (with `http://` or `https://`)
- [ ] **Did NOT** commit `.env.local` to git
- [ ] Restarted dev server after adding variables

---

**Environment setup complete! 🎉**

Start your dev server: `npm run dev`
