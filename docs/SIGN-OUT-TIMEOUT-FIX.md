# Sign Out Timeout Fix

## 🐛 The Problem

When inactive for a while, clicking "Sign Out" would get stuck on "Signing out..." because:

- Session expired on the server
- `supabase.auth.signOut()` was waiting for server response
- Request would hang or timeout
- User had to refresh and try again

## ✅ The Solution

Improved the `signOut()` function in `AuthContext` to:

1. **Add a 5-second timeout** - Don't wait forever for server
2. **Force local cleanup** - Always clear state regardless of server response
3. **Clear cookies manually** - Remove all Supabase cookies client-side
4. **Always redirect** - Navigate to homepage even if sign out fails

### Before (Hanging):

```typescript
const signOut = async () => {
  await supabase.auth.signOut(); // ← Could hang forever
  setUser(null);
  setProfile(null);
  setSession(null);
  router.push("/");
};
```

### After (Robust):

```typescript
const signOut = async () => {
  try {
    // Race between sign out and 5-second timeout
    const signOutPromise = supabase.auth.signOut();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Sign out timeout")), 5000)
    );
    await Promise.race([signOutPromise, timeoutPromise]);
  } catch (error) {
    console.error("Error signing out:", error);
    // Continue anyway
  } finally {
    // ALWAYS clear state and redirect
    setUser(null);
    setProfile(null);
    setSession(null);

    // Manually clear Supabase cookies
    document.cookie.split(";").forEach((c) => {
      const cookieName = c.split("=")[0].trim();
      if (cookieName.startsWith("sb-")) {
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      }
    });

    router.push("/");
    router.refresh();
  }
};
```

## 🔑 Key Improvements

1. **Timeout Protection**
   - Maximum 5 seconds waiting for server
   - Won't hang indefinitely

2. **Graceful Degradation**
   - If server sign out fails, continue anyway
   - Local state always cleared

3. **Manual Cookie Cleanup**
   - Removes all `sb-*` cookies (Supabase auth cookies)
   - Ensures clean logout even if server unreachable

4. **Always Redirects**
   - User always returns to homepage
   - No stuck state

## 🧪 Testing Scenarios

### Test 1: Normal Sign Out (Active Session)

1. Sign in normally
2. Click "Sign Out" immediately
3. Should sign out quickly (< 1 second)
4. Redirects to homepage ✅

### Test 2: Expired Session Sign Out

1. Sign in normally
2. Wait 30 minutes (or restart server to simulate)
3. Click "Sign Out"
4. Should timeout after 5 seconds max
5. Still clears state and redirects ✅

### Test 3: Network Error Sign Out

1. Sign in normally
2. Disconnect internet
3. Click "Sign Out"
4. Should timeout and still clear local state ✅

## 📊 Sign Out Flow

```
User clicks "Sign Out"
       ↓
Button shows "Signing out..."
       ↓
Try supabase.auth.signOut() with 5s timeout
       ↓
    Success? ──No──→ Log error, continue anyway
       ↓ Yes
       ↓
Clear local state (user, profile, session)
       ↓
Clear Supabase cookies manually
       ↓
Redirect to homepage
       ↓
Refresh router
       ↓
User sees "Sign In / Sign Up"
```

## 🔒 Security Notes

- **Server-side sign out still attempted** - We try to invalidate the session
- **Local cleanup guaranteed** - Even if server unreachable
- **Cookies cleared** - No residual auth tokens
- **State reset** - All React state cleared

This ensures the user is always logged out client-side, even if the server is slow or unreachable.

## 📁 Files Changed

- ✅ `src/contexts/AuthContext.tsx` - Improved `signOut()` with timeout
- ✅ `src/components/Navbar.tsx` - Better error handling in `handleSignOut()`

## ✅ What This Fixes

1. **No more hanging** - 5-second timeout prevents infinite waiting
2. **Always works** - Sign out succeeds even with expired sessions
3. **No refresh needed** - Works on first click
4. **Better UX** - Quick response, clear feedback
5. **Reliable** - Works offline or with network issues

## 🎯 User Experience

**Before:**

- Click "Sign Out" → Stuck on "Signing out..." → Wait 30s+ → Nothing → Refresh → Try again

**After:**

- Click "Sign Out" → "Signing out..." (max 5s) → Redirected to homepage ✅

---

**Sign out now works reliably, even with expired sessions! 🎉**
