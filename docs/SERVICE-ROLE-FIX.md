# Service Role Client Fix

## 🐛 The Real Problem

The `createAdminClient()` function was using `@supabase/ssr` with cookies, which was causing the service role key to not work properly. Even though we had:

- ✅ Correct service role key
- ✅ Proper RLS policies
- ❌ Wrong client implementation

## ✅ The Solution

Changed `createAdminClient()` to use `@supabase/supabase-js` directly instead of the SSR wrapper.

### Before (Not Working):

```typescript
export async function createAdminClient() {
  const cookieStore = await cookies();

  return createServerClient(
    // ← Using SSR client
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        /* cookie handling */
      },
    }
  );
}
```

### After (Working):

```typescript
export async function createAdminClient() {
  const { createClient: createSupabaseClient } = await import(
    "@supabase/supabase-js"
  );

  return createSupabaseClient(
    // ← Using direct client
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
```

## 🔑 Key Differences

| Aspect   | SSR Client                 | Direct Client              |
| -------- | -------------------------- | -------------------------- |
| Purpose  | User sessions with cookies | Admin operations           |
| Auth     | Cookie-based               | Service role key           |
| RLS      | Respects user context      | Bypasses with service role |
| Use Case | Client-side auth           | Server-side admin tasks    |

## 🧪 Test Now!

Visit: **http://localhost:3001/api/test-db**

**Expected Result**:

```json
{
  "success": true,
  "message": "Database connection working!",
  "tests": {
    "canQuery": true,
    "canInsert": true, // ← Should NOW be TRUE!
    "insertError": null
  }
}
```

Then try signup: **http://localhost:3001/auth/signup**

## 📁 File Changed

- ✅ `src/lib/supabase/server.ts` - Updated `createAdminClient()` function

## ✅ What This Fixes

1. **Signup** - Users will now be created in `public.users`
2. **OAuth Callback** - Google users will get profiles
3. **Admin Operations** - Can now bypass RLS properly
4. **Cleanup** - Failed signups can delete orphaned users

---

**Test the endpoint and try signup again! 🚀**
