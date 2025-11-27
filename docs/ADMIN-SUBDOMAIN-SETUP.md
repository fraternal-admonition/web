# Admin Subdomain Setup Guide

## Overview

The Fraternal Admonition admin panel is accessible via a subdomain for security and organization purposes:

- **Production**: `https://admin.fraternaladmonition.com`
- **Local Development**: `http://localhost:3000/admin`

## Architecture

### Middleware Logic

The `middleware.ts` file handles subdomain routing:

1. **Production Mode** (when NOT on localhost):
   - Requests to `admin.fraternaladmonition.com` are rewritten to `/admin` path
   - Direct requests to `fraternaladmonition.com/admin` are blocked and redirected to home
   - This ensures admin panel is only accessible via the subdomain

2. **Local Development Mode** (on localhost):
   - Direct access to `/admin` is allowed for easier testing
   - No subdomain enforcement for development convenience

### Authentication & Authorization

All admin routes use:

1. `requireAdmin()` function that checks:
   - User is authenticated (redirects to `/auth/signin` if not)
   - User has `role = 'ADMIN'` in the database
   - User is not banned
2. **Service Role Key**: All admin API routes use `createAdminClient()` which uses the `SUPABASE_SERVICE_ROLE_KEY` to bypass Row Level Security (RLS) policies.

## Environment Variables Required

Create a `.env.local` file in your project root with:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Service Role Key (CRITICAL - bypasses RLS, keep secret!)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Email Configuration (for transactional emails)
RESEND_API_KEY=your_resend_api_key
```

### Where to Find Supabase Keys

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep this secret!)

## Local Testing

### Setup Steps

1. **Install dependencies**:

   ```bash
   npm install
   # or
   pnpm install
   ```

2. **Create `.env.local`** with the required environment variables (see above)

3. **Make yourself an admin** in Supabase:
   - Go to Supabase Dashboard → SQL Editor
   - Run this query (replace with your email):

   ```sql
   UPDATE public.users
   SET role = 'ADMIN'
   WHERE id = (
     SELECT id FROM auth.users WHERE email = 'your@email.com'
   );
   ```

4. **Start the development server**:

   ```bash
   npm run dev
   # or
   pnpm dev
   ```

5. **Access the admin panel**:
   - Open browser to: `http://localhost:3000/admin`
   - Sign in with your admin account
   - You should see the admin dashboard

### Testing Admin Features

#### CMS Pages

- **List**: `http://localhost:3000/admin/cms/pages`
- **Create**: `http://localhost:3000/admin/cms/pages/new`
- **Edit**: Click "Edit" on any page in the list

#### CMS Assets

- **List**: `http://localhost:3000/admin/cms/assets`
- **Upload**: `http://localhost:3000/admin/cms/assets/upload`

#### CMS Settings

- **Manage**: `http://localhost:3000/admin/cms/settings`

### Testing API Routes

All admin API routes are under `/api/admin/cms/`:

```bash
# List pages
curl http://localhost:3000/api/admin/cms/pages

# Create page
curl -X POST http://localhost:3000/api/admin/cms/pages \
  -H "Content-Type: application/json" \
  -d '{"slug":"test","title":"Test Page","content_rich_json":{"content":"Hello"},"published":false}'
```

Note: You must be authenticated as an admin user for these requests to work.

## Production Deployment

### DNS Configuration

Set up the following DNS records with your domain registrar:

#### For Main Domain (fraternaladmonition.com)

```
Type: A
Name: @
Value: [Your Vercel IP or use CNAME to vercel app]
```

Or use CNAME:

```
Type: CNAME
Name: @
Value: cname.vercel-dns.com
```

#### For Admin Subdomain (admin.fraternaladmonition.com)

```
Type: CNAME
Name: admin
Value: cname.vercel-dns.com
```

### Vercel Deployment Setup

1. **Add domains in Vercel**:
   - Go to your project → Settings → Domains
   - Add `fraternaladmonition.com`
   - Add `admin.fraternaladmonition.com`
   - Wait for DNS propagation (can take up to 48 hours, usually much faster)

2. **Environment Variables**:
   - Go to your project → Settings → Environment Variables
   - Add all variables from `.env.local`:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `RESEND_API_KEY`
   - Make sure to set them for all environments (Production, Preview, Development)

3. **Deploy**:
   ```bash
   git push origin master
   ```

   - Vercel will automatically deploy
   - Both domains will be live once DNS propagates

### Testing Production Deployment

1. **Main Site**:
   - Visit: `https://fraternaladmonition.com`
   - Should show the public homepage
   - Try accessing: `https://fraternaladmonition.com/admin`
   - Should redirect to homepage (blocked)

2. **Admin Site**:
   - Visit: `https://admin.fraternaladmonition.com`
   - Should show the admin sign-in page
   - Sign in with your admin account
   - You should see the admin dashboard

3. **Admin Features**:
   - Test creating/editing pages
   - Test uploading assets
   - Test creating/editing settings

## Security Considerations

### Service Role Key Security

⚠️ **CRITICAL**: The `SUPABASE_SERVICE_ROLE_KEY` bypasses all Row Level Security policies!

**Why it's safe in this implementation:**

1. Service role key is only used in server-side API routes
2. API routes check authentication BEFORE using service role key
3. API routes verify user has `role = 'ADMIN'`
4. Service role key is never exposed to the client

**Best practices:**

- Never commit `.env.local` to git (it's in `.gitignore`)
- Rotate service role key if compromised
- Monitor admin activity logs
- Keep RLS policies enabled on all tables
- Only grant admin role to trusted users

### Admin Access Control

To make a user an admin:

```sql
-- Via Supabase Dashboard → SQL Editor
UPDATE public.users
SET role = 'ADMIN'
WHERE id = 'user-uuid-here';
```

To revoke admin access:

```sql
UPDATE public.users
SET role = 'USER'
WHERE id = 'user-uuid-here';
```

To ban a user:

```sql
UPDATE public.users
SET is_banned = true
WHERE id = 'user-uuid-here';
```

## Troubleshooting

### Issue: "Unauthorized" when accessing admin routes locally

**Solution:**

1. Make sure you're signed in
2. Check that your user has `role = 'ADMIN'` in the database:
   ```sql
   SELECT id, role FROM public.users
   WHERE id = (SELECT id FROM auth.users WHERE email = 'your@email.com');
   ```
3. Sign out and sign back in after changing role

### Issue: "Failed to fetch pages" or RLS policy errors

**Solution:**

1. Verify `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local`
2. Restart the development server after adding env variables
3. Check that the service role key is correct (copy from Supabase Dashboard)

### Issue: Can't access `/admin` locally

**Solution:**

1. Make sure you're using `http://localhost:3000/admin` (not the IP address)
2. Clear browser cache and cookies
3. Check browser console for errors

### Issue: Admin subdomain not working in production

**Solution:**

1. Verify DNS records are correct:
   ```bash
   dig admin.fraternaladmonition.com
   ```
2. Make sure domain is added in Vercel → Settings → Domains
3. Wait for DNS propagation (up to 48 hours)
4. Check Vercel deployment logs for errors

### Issue: "Page not found" on admin subdomain in production

**Solution:**

1. Verify middleware is deployed (check in Vercel logs)
2. Make sure both domains are configured in Vercel
3. Try redeploying:
   ```bash
   git commit --allow-empty -m "Trigger redeploy"
   git push origin master
   ```

## File Structure

```
src/
├── app/
│   ├── admin/                    # Admin pages (requires auth)
│   │   ├── layout.tsx           # Admin layout with nav
│   │   ├── page.tsx             # Admin dashboard
│   │   └── cms/
│   │       ├── pages/           # CMS Pages management
│   │       ├── assets/          # CMS Assets management
│   │       └── settings/        # CMS Settings management
│   └── api/
│       └── admin/
│           └── cms/             # Admin API routes (use service role)
│               ├── pages/
│               ├── assets/
│               └── settings/
├── lib/
│   ├── admin-auth.ts            # Admin authentication helper
│   └── supabase/
│       └── server.ts            # Contains createAdminClient()
└── middleware.ts                # Subdomain routing logic
```

## API Reference

### CMS Pages

| Method | Endpoint                   | Description         |
| ------ | -------------------------- | ------------------- |
| GET    | `/api/admin/cms/pages`     | List all pages      |
| POST   | `/api/admin/cms/pages`     | Create a new page   |
| GET    | `/api/admin/cms/pages/:id` | Get a specific page |
| PUT    | `/api/admin/cms/pages/:id` | Update a page       |
| DELETE | `/api/admin/cms/pages/:id` | Delete a page       |

### CMS Assets

| Method | Endpoint                    | Description               |
| ------ | --------------------------- | ------------------------- |
| GET    | `/api/admin/cms/assets`     | List all assets           |
| POST   | `/api/admin/cms/assets`     | Create a new asset record |
| DELETE | `/api/admin/cms/assets/:id` | Delete an asset           |

### CMS Settings

| Method | Endpoint                      | Description          |
| ------ | ----------------------------- | -------------------- |
| GET    | `/api/admin/cms/settings`     | List all settings    |
| POST   | `/api/admin/cms/settings`     | Create a new setting |
| PUT    | `/api/admin/cms/settings/:id` | Update a setting     |
| DELETE | `/api/admin/cms/settings/:id` | Delete a setting     |

## Next Steps

After setting up the admin panel:

1. Create your first CMS pages (About, Rules, FAQ, Contact)
2. Upload illustration assets for the contest
3. Configure site settings (site lock, banners, etc.)
4. Move on to Phase 1.4: Blog/Updates system

---

**Last Updated**: 2025-10-07
