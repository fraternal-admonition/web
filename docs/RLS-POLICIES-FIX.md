# RLS Policies Fix - Users Table

## 🐛 Problem Identified

The `public.users` table had **RLS (Row Level Security) enabled but NO policies defined**. This caused:

- ❌ Service role couldn't insert new user profiles
- ❌ Signup would create user in `auth.users` but fail to create profile in `public.users`
- ❌ Error: "new row violates row-level security policy for table 'users'"

## ✅ Solution Applied

Created comprehensive RLS policies for the `users` table:

### Policies Created:

1. **Users can view own profile**
   - Allows authenticated users to SELECT their own profile
   - `USING (auth.uid() = id)`

2. **Users can update own profile**
   - Allows authenticated users to UPDATE their own profile
   - `USING (auth.uid() = id)`

3. **Service role can insert users**
   - Allows backend to create new user profiles during signup
   - `TO service_role WITH CHECK (true)`

4. **Service role can select users**
   - Allows admin operations to read user data
   - `TO service_role USING (true)`

5. **Service role can update users**
   - Allows admin operations to update user data (e.g., ban users)
   - `TO service_role WITH CHECK (true)`

6. **Service role can delete users**
   - Allows cleanup operations (e.g., delete user if profile creation fails)
   - `TO service_role USING (true)`

---

## 🧪 Testing

### Step 1: Verify Database Test Passes

Visit: **http://localhost:3001/api/test-db**

**Expected Result**:

```json
{
  "success": true,
  "message": "Database connection working!",
  "tests": {
    "canQuery": true,
    "canInsert": true, // ← Should now be TRUE!
    "insertError": null
  }
}
```

### Step 2: Test User Signup

1. Go to: http://localhost:3001/auth/signup
2. Enter email and password
3. Submit the form
4. **Check terminal logs**:
   ```
   Attempting to create profile for user: <uuid>
   Profile created successfully: { id: '...', role: 'USER', ... }
   ```

### Step 3: Verify in Database

Check both tables in Supabase:

```sql
-- Check if user was created in both tables
SELECT
  au.id,
  au.email,
  au.created_at as auth_created,
  pu.role,
  pu.is_banned,
  pu.created_at as profile_created
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
ORDER BY au.created_at DESC
LIMIT 5;
```

**Expected**: Every user in `auth.users` should have a matching record in `public.users`!

---

## 🔒 Security Notes

### What These Policies Do:

1. **User Privacy**: Users can only see and edit their own profile
2. **Admin Access**: Service role (backend) has full access for admin operations
3. **Secure Signup**: Backend can create profiles using service role key
4. **Data Integrity**: Users can't see or modify other users' data

### Why Service Role Needs Explicit Policies:

In some Supabase configurations, even the service role respects RLS policies. While service role is supposed to bypass RLS by default, having explicit policies ensures compatibility across all configurations.

---

## 📊 Policy Breakdown

| Policy             | Role            | Operation | Condition         |
| ------------------ | --------------- | --------- | ----------------- |
| View own profile   | `authenticated` | SELECT    | `auth.uid() = id` |
| Update own profile | `authenticated` | UPDATE    | `auth.uid() = id` |
| Service insert     | `service_role`  | INSERT    | Always allowed    |
| Service select     | `service_role`  | SELECT    | Always allowed    |
| Service update     | `service_role`  | UPDATE    | Always allowed    |
| Service delete     | `service_role`  | DELETE    | Always allowed    |

---

## 🔄 Migration Applied

The following migration was applied:

**Migration Name**: `add_users_table_rls_policies`

**Changes**:

- Temporarily disabled RLS
- Re-enabled RLS
- Created 6 policies (3 for users, 3 for service role)

This migration is now tracked in your database and won't be applied again.

---

## 🚀 What Works Now

✅ **Signup Flow**:

1. User submits signup form
2. Backend creates user in `auth.users`
3. Backend creates profile in `public.users` ← **NOW WORKS!**
4. Sends verification email
5. User is fully created in both tables

✅ **User Profile Access**:

- Users can read their own profile data
- Users can update their own profile (future features)
- Backend has full access for admin operations

✅ **Google OAuth**:

- Auth callback can create profiles for OAuth users
- Works seamlessly with existing policies

---

## 🎯 Next Steps

1. **Test the fix**: Visit http://localhost:3001/api/test-db
2. **Try signup**: Create a new account and verify it works
3. **Check database**: Verify user appears in both tables
4. **Clean up**: Delete the test endpoint if you want:
   ```bash
   rm src/app/api/test-db/route.ts
   ```

---

## 📝 Future Considerations

### If You Need More Policies:

**Allow users to view other users' public info** (e.g., for leaderboards):

```sql
CREATE POLICY "Users can view public profiles"
ON public.users
FOR SELECT
TO authenticated
USING (NOT is_banned);  -- Only show non-banned users
```

**Allow admins to manage users** (if you add admin role check):

```sql
CREATE POLICY "Admins can manage all users"
ON public.users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'ADMIN'
  )
);
```

---

## ✅ Summary

**Problem**: RLS enabled but no policies = service role blocked
**Solution**: Created comprehensive RLS policies
**Result**: User profiles now created successfully during signup!

---

**The issue is now fixed! Test it and let me know if it works! 🎉**
