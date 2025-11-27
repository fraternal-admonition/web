# Admin Dashboard Redirect Fix

## Issues Fixed

### 1. Wrong Post-Login Redirect

**Problem:** After signing in as an admin, users were redirected to `/dashboard` instead of `/admin`.

**Solution:** Updated sign-in logic to check user role and redirect accordingly:

- Regular users → `/dashboard`
- Admin users → `/admin`

### 2. Wrong Dashboard Link in Navbar

**Problem:** The "Dashboard" link in the navbar always pointed to `/dashboard` for all users, including admins.

**Solution:** Made the Dashboard link dynamic based on user role:

- Regular users → `/dashboard`
- Admin users → `/admin`

---

## Files Modified

### 1. `src/app/auth/signin/page.tsx`

#### Change 1: Initial redirect check (when already logged in)

```typescript
// Before:
useEffect(() => {
  if (!authLoading && user) {
    router.push("/dashboard");
  }
}, [user, authLoading, router]);

// After:
useEffect(() => {
  const checkRedirect = async () => {
    if (!authLoading && user) {
      // Check if user is admin
      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    }
  };

  checkRedirect();
}, [user, authLoading, router, supabase]);
```

#### Change 2: Post-login redirect

```typescript
// Before:
router.push("/dashboard");

// After:
let userRole = "USER";
if (checkResponse.ok) {
  const checkData = await checkResponse.json();
  if (checkData.banned) {
    await supabase.auth.signOut();
    throw new Error("Your account has been banned. Please contact support.");
  }
  userRole = checkData.role || "USER";
}

// Navigate to appropriate dashboard based on role
if (userRole === "ADMIN") {
  router.push("/admin");
} else {
  router.push("/dashboard");
}
```

### 2. `src/components/Navbar.tsx`

#### Desktop Navigation

```typescript
// Before:
<Link href="/dashboard" ...>
  Dashboard
</Link>

// After:
<Link href={profile?.role === "ADMIN" ? "/admin" : "/dashboard"} ...>
  Dashboard
</Link>
```

#### Mobile Navigation

```typescript
// Before:
<Link href="/dashboard" ...>
  Dashboard
</Link>

// After:
<Link href={profile?.role === "ADMIN" ? "/admin" : "/dashboard"} ...>
  Dashboard
</Link>
```

---

## User Flow - Admin

### Before Fix:

1. Admin visits `https://admin.fraternaladmonition.com`
2. Redirects to sign-in
3. Signs in successfully
4. **Problem:** Redirected to `/dashboard` ❌
5. Clicks "Dashboard" in navbar
6. **Problem:** Goes to `/dashboard` again ❌

### After Fix:

1. Admin visits `https://admin.fraternaladmonition.com`
2. Redirects to sign-in
3. Signs in successfully
4. **Solution:** Redirected to `/admin` ✅
5. Clicks "Dashboard" in navbar
6. **Solution:** Goes to `/admin` ✅

---

## User Flow - Regular User

### Flow (Unchanged):

1. User visits `https://fraternaladmonition.com`
2. Signs in
3. Redirected to `/dashboard` ✅
4. Clicks "Dashboard" in navbar
5. Goes to `/dashboard` ✅

---

## Testing

### Local Testing

```bash
pnpm dev
```

#### Test as Regular User:

1. Sign in as a regular user at `http://localhost:3000/auth/signin`
2. Should redirect to `/dashboard` ✅
3. Click "Dashboard" in navbar
4. Should go to `/dashboard` ✅

#### Test as Admin:

1. Make yourself admin:
   ```sql
   UPDATE public.users SET role = 'ADMIN'
   WHERE id = (SELECT id FROM auth.users WHERE email = 'your@email.com');
   ```
2. Sign in at `http://localhost:3000/auth/signin`
3. Should redirect to `/admin` ✅
4. Click "Dashboard" in navbar
5. Should go to `/admin` ✅

### Production Testing

#### Test as Admin on Admin Subdomain:

1. Visit `https://admin.fraternaladmonition.com`
2. Sign in as admin
3. Should see admin dashboard ✅
4. Click "Dashboard" in navbar
5. Should stay on admin dashboard ✅

#### Test Dashboard Link:

1. Navigate away from admin dashboard
2. Click "Dashboard" in navbar
3. Should return to `/admin` (which gets rewritten to admin panel) ✅

---

## Related Fixes

This complements the previous fix in `docs/ADMIN-SUBDOMAIN-AUTH-FIX.md` which fixed the auth route rewriting issue.

Together, these fixes ensure:

1. ✅ Admin subdomain auth routes work correctly
2. ✅ Admins are redirected to `/admin` after sign-in
3. ✅ Dashboard link in navbar goes to correct location for each role
4. ✅ Already-logged-in admins are redirected to `/admin`

---

## Deploy

```bash
git add src/app/auth/signin/page.tsx src/components/Navbar.tsx
git commit -m "Fix admin redirect after login and dashboard navbar link"
git push origin master
```

---

**Fixed**: 2025-10-07
