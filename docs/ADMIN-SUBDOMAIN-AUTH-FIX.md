# Admin Subdomain Authentication Fix

## Issue

When accessing the admin panel via `https://admin.fraternaladmonition.com`, users were redirected to `/auth/signin?redirect=/admin`, which resulted in a **404 Not Found** error.

## Root Cause

The middleware was rewriting **all paths** on the admin subdomain to include `/admin` prefix:

```typescript
// Before fix:
if (isAdminSubdomain && !isAdminPath) {
  url.pathname = `/admin${url.pathname}`;
  return NextResponse.rewrite(url);
}
```

This caused:

- `admin.fraternaladmonition.com/` → `/admin/` ✅ (correct)
- `admin.fraternaladmonition.com/auth/signin` → `/admin/auth/signin` ❌ (doesn't exist!)

The actual auth routes exist at the root level (`/auth/signin`), not under `/admin`.

## Solution

Updated the middleware to **exclude** authentication and API routes from the rewrite logic:

```typescript
// After fix:
if (isAdminSubdomain) {
  // Allow auth and api routes to pass through normally
  if (!isAuthPath && !isApiPath && !isAdminPath) {
    // Only rewrite root and other paths to /admin
    url.pathname = `/admin${url.pathname}`;
    return NextResponse.rewrite(url);
  }
}
```

## What Changed

### Before:

| URL on admin subdomain | Rewritten to                 | Result   |
| ---------------------- | ---------------------------- | -------- |
| `/`                    | `/admin/`                    | ✅ Works |
| `/auth/signin`         | `/admin/auth/signin`         | ❌ 404   |
| `/api/admin/cms/pages` | `/admin/api/admin/cms/pages` | ❌ 404   |

### After:

| URL on admin subdomain | Rewritten to           | Result   |
| ---------------------- | ---------------------- | -------- |
| `/`                    | `/admin/`              | ✅ Works |
| `/auth/signin`         | `/auth/signin`         | ✅ Works |
| `/api/admin/cms/pages` | `/api/admin/cms/pages` | ✅ Works |

## User Flow Now

1. User visits `https://admin.fraternaladmonition.com`
2. Middleware rewrites to `/admin/`
3. `requireAdmin()` checks authentication
4. Not authenticated → redirects to `/auth/signin?redirect=/admin`
5. `/auth/signin` is **not rewritten** (auth routes pass through)
6. User sees the sign-in page ✅
7. After signing in, redirects back to `/admin/`

## Files Modified

- `middleware.ts` - Added logic to exclude `/auth` and `/api` paths from rewriting on admin subdomain

## Testing

### Local Testing

```bash
# Start dev server
pnpm dev

# Test these URLs:
http://localhost:3000/admin
# Should redirect to sign-in if not authenticated

http://localhost:3000/auth/signin
# Should show sign-in page
```

### Production Testing

```
https://admin.fraternaladmonition.com
# Should redirect to sign-in page if not authenticated

https://admin.fraternaladmonition.com/auth/signin
# Should show sign-in page directly
```

## Deploy

```bash
git add middleware.ts
git commit -m "Fix auth routes on admin subdomain"
git push origin master
```

After deployment, `https://admin.fraternaladmonition.com` should properly redirect to the sign-in page instead of showing 404.

---

**Fixed**: 2025-10-07
