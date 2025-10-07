# OAuth Callback Profile Creation Fix

## 🐛 The Bug

The auth callback route had a **logic error** in the profile creation check:

```typescript
// WRONG - This never executed!
if (!existingProfile && !profileCheckError) {
  // Create profile
}
```

**Why it failed:**

- When a profile doesn't exist, Supabase returns `profileCheckError` with code "PGRST116" (not found)
- The condition required BOTH `!existingProfile` AND `!profileCheckError` to be true
- But if there's no profile, `profileCheckError` is truthy (the "not found" error)
- So the condition was **always false** and profiles were never created!

## ✅ The Fix

Changed the condition to only check if the profile exists:

```typescript
// CORRECT - Only check if profile doesn't exist
if (!existingProfile) {
  // Create profile
  console.log("Creating profile for OAuth user:", data.user.id);

  const { data: newProfile, error: profileError } = await adminClient
    .from("users")
    .insert({
      id: data.user.id,
      role: "USER",
      is_banned: false,
    })
    .select()
    .single();
}
```

**Why it works:**

- Only checks `!existingProfile` (profile data is null)
- Doesn't care about the "not found" error - that's expected!
- Creates the profile successfully
- Logs success/failure for debugging

## 🔧 Additional Fixes

### 1. Created Profiles for Existing Users

Ran SQL to create profiles for any existing OAuth users:

```sql
INSERT INTO public.users (id, role, is_banned)
SELECT
  au.id,
  'USER' as role,
  false as is_banned
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;
```

**Result:** All existing users now have profiles! ✅

### 2. Added Detailed Logging

The callback now logs:

- User ID being checked
- Whether profile exists
- Profile creation attempt
- Success or failure with details

Check your terminal when OAuth users sign in!

## 🧪 Testing

### For New Google OAuth Users:

1. Sign out if you're logged in
2. Go to http://localhost:3001/auth/signin
3. Click "Continue with Google"
4. Sign in with Google
5. **Check your terminal** - should see:
   ```
   OAuth callback - checking profile for user: <uuid>
   Existing profile: null
   Profile check error: { code: 'PGRST116', message: '...' }
   Creating profile for OAuth user: <uuid>
   Profile created successfully: { id: '...', role: 'USER', ... }
   ```
6. Verify in Supabase that user exists in both `auth.users` and `public.users`

### For Existing Users:

All your existing users now have profiles! Verify:

```sql
SELECT
  au.id,
  au.email,
  au.raw_app_meta_data->>'provider' as provider,
  pu.role,
  pu.is_banned
FROM auth.users au
INNER JOIN public.users pu ON au.id = pu.id
ORDER BY au.created_at DESC;
```

Should show all users with their profiles!

## ✅ What's Fixed Now

1. ✅ **Google OAuth creates profiles** - New OAuth users get `public.users` entries
2. ✅ **Email signup creates profiles** - Email users already worked
3. ✅ **Existing users have profiles** - Backfilled all missing profiles
4. ✅ **Detailed logging** - Easy to debug if issues occur
5. ✅ **Service role works** - Using direct Supabase client
6. ✅ **RLS policies in place** - Secure by default

## 📁 Files Changed

- ✅ `src/app/auth/callback/route.ts` - Fixed profile creation logic
- ✅ `src/lib/supabase/server.ts` - Fixed admin client (earlier)
- ✅ Database - Backfilled missing profiles

## 🎯 Complete Flow Now

### Email Signup:

1. User fills form → POST `/api/auth/signup`
2. Creates user in `auth.users` ✅
3. **Immediately creates profile in `public.users`** ✅
4. Sends verification email ✅
5. User clicks link → GET `/auth/callback`
6. Verifies email and redirects to dashboard ✅

### Google OAuth:

1. User clicks "Continue with Google"
2. Google OAuth flow → GET `/auth/callback?code=...`
3. Exchanges code for session ✅
4. **Checks if profile exists** ✅
5. **Creates profile if missing** ✅
6. Redirects to dashboard ✅

## 🚀 Verification

Check your users table in Supabase:

```sql
-- Count users by auth method
SELECT
  raw_app_meta_data->>'provider' as provider,
  COUNT(*) as count,
  COUNT(pu.id) as profiles_count
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
GROUP BY raw_app_meta_data->>'provider';
```

**Expected:** `count` should equal `profiles_count` for all providers!

---

**All profile creation issues are now fixed! 🎉**

Every user - whether email or OAuth - now gets a `public.users` profile automatically!
