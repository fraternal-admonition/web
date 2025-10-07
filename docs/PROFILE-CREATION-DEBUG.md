# Profile Creation Debug Guide

## 🐛 Issue: Users Not Created in `public.users`

If users are being created in `auth.users` but not in `public.users`, follow these debugging steps:

---

## ✅ What I Fixed

### 1. **Improved Error Handling in Signup Route**

The signup route now:

- ✅ Logs detailed error information
- ✅ Returns the profile data to verify creation
- ✅ **Deletes the auth user** if profile creation fails (prevents orphaned users)
- ✅ Returns a proper error message to the frontend

### 2. **Created Debug Endpoint**

A new test endpoint at `/api/test-db` to verify:

- Database connection
- Service role key configuration
- Insert permissions

---

## 🧪 Debugging Steps

### Step 1: Test Database Connection

Visit: **http://localhost:3001/api/test-db**

**Expected Response** (success):

```json
{
  "success": true,
  "message": "Database connection working!",
  "tests": {
    "canQuery": true,
    "canInsert": true,
    "insertError": null
  },
  "envCheck": {
    "hasServiceRoleKey": true,
    "hasSupabaseUrl": true,
    "serviceRoleKeyPrefix": "eyJhbGciOiJIUzI1NiI..."
  }
}
```

**If you see an error**, it means:

- ❌ Service role key is missing or incorrect
- ❌ Supabase URL is incorrect
- ❌ RLS policies are blocking even the service role
- ❌ Table doesn't exist or has wrong schema

---

### Step 2: Try Creating a New Account

1. Go to: http://localhost:3001/auth/signup
2. Enter email and password
3. Submit the form
4. **Check your terminal** for these logs:
   ```
   Attempting to create profile for user: <user-id>
   Profile created successfully: { ... }
   ```

**If you see an error** in the terminal like:

```
Profile creation error: { code: '...' }
```

This tells us exactly what's wrong!

---

### Step 3: Check Your Environment Variables

Make sure your `.env.local` has:

```env
NEXT_PUBLIC_SUPABASE_URL=https://mlbhsippcnzeybheudhu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...  # ⚠️ This one is critical!
```

**Verify the service role key:**

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Settings > API
4. Look for **service_role** key (NOT anon key!)
5. Copy the entire key
6. Paste into `.env.local`
7. **Restart your dev server!**

---

## 🔍 Common Issues & Solutions

### Issue 1: Service Role Key Missing or Wrong

**Symptom**: Test endpoint shows `hasServiceRoleKey: false` or insert fails

**Solution**:

1. Copy the **service_role** key from Supabase Dashboard
2. Add to `.env.local` as `SUPABASE_SERVICE_ROLE_KEY=...`
3. Restart dev server: `Ctrl+C` then `npm run dev`

---

### Issue 2: RLS Policies Blocking Inserts

**Symptom**: Error message includes "row-level security policy"

**Solution**:
The service role key should bypass RLS, but let's verify:

1. Go to Supabase Dashboard
2. Table Editor > `users` table
3. Click the shield icon (RLS)
4. Make sure you have a policy like:

```sql
-- Policy for inserting new users (service role bypass isn't working)
CREATE POLICY "Allow service role to insert"
ON public.users
FOR INSERT
TO service_role
USING (true)
WITH CHECK (true);
```

But actually, **service role should bypass all RLS**. If this is an issue, your service role key might be incorrect.

---

### Issue 3: Table Schema Mismatch

**Symptom**: Error about missing columns or wrong data types

**Solution**:
Verify your `public.users` table schema:

```sql
-- Check your table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users';
```

**Expected columns**:

- `id` (uuid, primary key, references auth.users)
- `role` (text or enum: USER, TESTER, ADMIN)
- `display_id` (text, nullable)
- `country` (text, nullable)
- `is_banned` (boolean, default false)
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)

---

### Issue 4: Foreign Key Constraint

**Symptom**: Error about "violates foreign key constraint"

**Solution**:
The issue might be with the timing. The auth user might not be committed yet when we try to create the profile.

**Check if your FK constraint has this:**

```sql
-- View the constraint
SELECT conname, contype, conrelid::regclass, confrelid::regclass
FROM pg_constraint
WHERE conname LIKE '%users%';

-- If needed, recreate with proper timing
ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_id_fkey;

ALTER TABLE public.users
  ADD CONSTRAINT users_id_fkey
  FOREIGN KEY (id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE
  DEFERRABLE INITIALLY DEFERRED;  -- ← Important!
```

---

## 🛠️ Manual Testing in Supabase

### Test 1: Can Service Role Insert?

Run this in Supabase SQL Editor:

```sql
-- Try to insert a test user (using service role)
INSERT INTO public.users (id, role, is_banned)
VALUES ('00000000-0000-0000-0000-000000000099', 'USER', false)
RETURNING *;

-- Clean up
DELETE FROM public.users WHERE id = '00000000-0000-0000-0000-000000000099';
```

**If this works**, your table is fine!

**If this fails**, check:

- Table exists
- Column names match exactly
- No triggers blocking inserts

---

### Test 2: Check Existing Auth Users Without Profiles

```sql
-- Find orphaned auth users (no profile)
SELECT
  au.id,
  au.email,
  au.created_at,
  CASE WHEN pu.id IS NULL THEN 'NO PROFILE' ELSE 'HAS PROFILE' END as status
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
ORDER BY au.created_at DESC
LIMIT 10;
```

**If you see users without profiles**, create them manually:

```sql
-- Create missing profiles
INSERT INTO public.users (id, role, is_banned)
SELECT
  au.id,
  'USER' as role,
  false as is_banned
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;
```

---

## 📋 Improved Signup Flow

The signup route now:

1. Creates user in `auth.users`
2. Immediately creates profile in `public.users`
3. **If profile creation fails**:
   - Logs detailed error
   - Deletes the auth user (cleanup)
   - Returns error to frontend
   - User can try again
4. **If profile creation succeeds**:
   - Logs success
   - Returns success to frontend
   - Sends verification email

This ensures **no orphaned users** in `auth.users` without a `public.users` profile.

---

## 🧹 Cleanup: Delete Test Route

After debugging, delete the test endpoint:

```bash
rm src/app/api/test-db/route.ts
```

Or keep it for future debugging (just don't deploy it to production!).

---

## ✅ Verification Checklist

After fixing, verify:

- [ ] Visit http://localhost:3001/api/test-db - should return success
- [ ] Check `.env.local` has correct `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Restart dev server after changing env variables
- [ ] Try creating a new account
- [ ] Check terminal logs for "Profile created successfully"
- [ ] Verify in Supabase Table Editor that user appears in `public.users`
- [ ] Verify user also in `auth.users`
- [ ] Check that both have the same UUID

---

## 🚀 Next Steps

1. First, visit the test endpoint: http://localhost:3001/api/test-db
2. Check what error you get
3. Follow the debugging steps above based on the error
4. Try creating a new account
5. Check terminal logs and database

Let me know what you see in the test endpoint and I can help further!

---

**The fix is now in place - profiles will be created or the signup will fail cleanly! 🎉**
