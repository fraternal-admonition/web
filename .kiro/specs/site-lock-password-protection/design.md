# Design Document

## Overview

This design implements a password-protected site lock feature that complements the existing authentication-based site lock. The implementation provides administrators with two access control modes:

1. **Authentication Mode** (existing): Requires users to sign in with their accounts
2. **Password Mode** (new): Requires a single shared password for access

The design uses secure password hashing (bcrypt), session-based access management, middleware enforcement, and an intuitive admin interface. It maintains backwards compatibility with the existing `site_lock_enabled` boolean while introducing a more flexible `site_lock_mode` setting.

### Key Design Principles

1. **Security First**: Use bcrypt for password hashing, secure session cookies, rate limiting
2. **Backwards Compatible**: Migrate existing boolean setting to new mode-based setting
3. **Middleware Enforcement**: Consistent protection across all routes
4. **Session-Based Access**: Users enter password once, access persists across navigation
5. **Admin Bypass**: Administrators always bypass password protection
6. **Clean UX**: Simple, branded password prompt page
7. **Fail Secure**: Default to protection enabled if configuration is ambiguous

## Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────┐
│                    Incoming Request                      │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  Next.js Middleware                      │
│  1. Check if user is admin → bypass all locks           │
│  2. Check maintenance mode → redirect if active          │
│  3. Fetch site_lock_mode from settings                   │
│  4. If mode = "auth" → redirect to signin if not auth    │
│  5. If mode = "password" → check password session        │
│  6. If no valid session → redirect to password prompt    │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              Password Prompt Page (if needed)            │
│  1. Show branded password form                           │
│  2. User submits password                                │
│  3. Verify against hashed password                       │
│  4. Create secure session cookie                         │
│  5. Redirect to originally requested page                │
└─────────────────────────────────────────────────────────┘
```


### Component Architecture

```
middleware.ts
├── checkSiteLockMode() → Determine active mode
├── checkPasswordSession() → Validate session cookie
└── redirectToPasswordPrompt() → Redirect with return URL

src/app/site-lock/page.tsx (new)
├── Password prompt UI
├── Form submission handler
└── Session creation

src/app/api/site-lock/verify/route.ts (new)
├── POST: Verify password
├── Hash comparison (bcrypt)
├── Rate limiting
└── Session cookie creation

src/lib/cms/settings-schema.ts (update)
├── site_lock_mode: "off" | "auth" | "password"
└── site_lock_password_hash: string (hashed)

src/lib/security/password-hash.ts (new)
├── hashPassword() → bcrypt hash
└── verifyPassword() → bcrypt compare

src/lib/security/site-lock-session.ts (new)
├── createSession() → Generate secure token
├── validateSession() → Verify token
└── invalidateAllSessions() → Clear on password change

src/components/admin/settings/SiteLockControl.tsx (new)
├── Mode selection (radio buttons)
├── Password input (conditional)
└── Save handler with validation
```

## Components and Interfaces

### 1. Database Schema Updates

**Update cms_settings table** (no migration needed, just new keys)

New setting keys:
- `site_lock_mode`: `"off"` | `"auth"` | `"password"`
- `site_lock_password_hash`: bcrypt hashed password string

The existing `site_lock_enabled` boolean will be migrated to `site_lock_mode`:
- `false` → `"off"`
- `true` → `"auth"`


### 2. Settings Schema Updates

**File**: `src/lib/cms/settings-schema.ts`

```typescript
export const SETTINGS_SCHEMA: SettingDefinition[] = [
  // ... existing settings ...
  
  // Replace site_lock_enabled with site_lock_mode
  {
    key: 'site_lock_mode',
    type: 'select',
    label: 'Site Lock',
    description: 'Control who can access the site. "Off" = public access, "Authentication" = require sign-in, "Password" = require shared password.',
    category: 'security',
    defaultValue: 'off',
    options: [
      { value: 'off', label: 'Off - Public Access' },
      { value: 'auth', label: 'Require Authentication' },
      { value: 'password', label: 'Require Password' },
    ],
  },
  {
    key: 'site_lock_password_hash',
    type: 'password', // New type for password fields
    label: 'Site Lock Password',
    description: 'Password required when "Require Password" mode is active. Minimum 8 characters.',
    category: 'security',
    defaultValue: '',
    // This setting is only shown when site_lock_mode = "password"
    conditionalDisplay: {
      dependsOn: 'site_lock_mode',
      showWhen: 'password',
    },
    validation: {
      minLength: 8,
      maxLength: 128,
    },
  },
];
```

**Update CachedSettings interface**:

```typescript
export interface CachedSettings {
  site_name: string;
  maintenance_mode: boolean;
  site_lock_mode: 'off' | 'auth' | 'password'; // Updated
  site_lock_password_hash: string; // New
  max_upload_size_mb: number;
  contact_email: string;
}
```


### 3. Password Hashing Service

**File**: `src/lib/security/password-hash.ts`

```typescript
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12; // Secure cost factor

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }
  
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}
```

**Dependencies**: Add `bcryptjs` and `@types/bcryptjs` to package.json


### 4. Session Management Service

**File**: `src/lib/security/site-lock-session.ts`

```typescript
import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';

const SESSION_COOKIE_NAME = 'site_lock_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

interface SessionData {
  token: string;
  createdAt: number;
  passwordHash: string; // Store hash to invalidate if password changes
}

// In-memory session store (could be Redis in production)
const sessions = new Map<string, SessionData>();

/**
 * Create a new password session
 */
export async function createPasswordSession(passwordHash: string): Promise<string> {
  const token = randomBytes(32).toString('hex');
  
  sessions.set(token, {
    token,
    createdAt: Date.now(),
    passwordHash,
  });
  
  // Set secure cookie
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
  
  return token;
}

/**
 * Validate a password session
 */
export async function validatePasswordSession(
  currentPasswordHash: string
): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  
  if (!token) return false;
  
  const session = sessions.get(token);
  if (!session) return false;
  
  // Check if password has changed since session was created
  if (session.passwordHash !== currentPasswordHash) {
    sessions.delete(token);
    return false;
  }
  
  // Check if session is expired (7 days)
  const age = Date.now() - session.createdAt;
  if (age > SESSION_MAX_AGE * 1000) {
    sessions.delete(token);
    return false;
  }
  
  return true;
}

/**
 * Invalidate all sessions (called when password changes)
 */
export function invalidateAllPasswordSessions(): void {
  sessions.clear();
}

/**
 * Delete current session
 */
export async function deletePasswordSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  
  if (token) {
    sessions.delete(token);
  }
  
  cookieStore.delete(SESSION_COOKIE_NAME);
}
```

**Note**: For production with multiple server instances, replace in-memory Map with Redis or database-backed sessions.


### 5. Password Verification API Route

**File**: `src/app/api/site-lock/verify/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { settingsCache } from '@/lib/cms/settings-cache';
import { verifyPassword } from '@/lib/security/password-hash';
import { createPasswordSession } from '@/lib/security/site-lock-session';
import { rateLimiter } from '@/lib/security/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 5 attempts per 15 minutes per IP
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const identifier = `site-lock:${ip}`;
    
    const rateLimit = await rateLimiter.checkLimit(
      identifier,
      5, // max attempts
      15 * 60 * 1000 // 15 minutes
    );
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil(
              (rateLimit.resetAt.getTime() - Date.now()) / 1000
            ).toString(),
          },
        }
      );
    }
    
    // Get submitted password
    const { password, redirect } = await request.json();
    
    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }
    
    // Get settings
    const settings = await settingsCache.get();
    
    // Check if password mode is active
    if (settings.site_lock_mode !== 'password') {
      return NextResponse.json(
        { error: 'Password protection is not enabled' },
        { status: 400 }
      );
    }
    
    // Check if password hash exists
    if (!settings.site_lock_password_hash) {
      console.error('Password mode enabled but no hash configured');
      return NextResponse.json(
        { error: 'Site lock is misconfigured' },
        { status: 500 }
      );
    }
    
    // Verify password
    const isValid = await verifyPassword(
      password,
      settings.site_lock_password_hash
    );
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Incorrect password' },
        { status: 401 }
      );
    }
    
    // Create session
    await createPasswordSession(settings.site_lock_password_hash);
    
    // Return success with redirect URL
    return NextResponse.json({
      success: true,
      redirect: redirect || '/',
    });
    
  } catch (error) {
    console.error('Site lock verification error:', error);
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
```


### 6. Password Prompt Page

**File**: `src/app/site-lock/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';

export default function SiteLockPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const redirect = searchParams.get('redirect') || '/';
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const response = await fetch('/api/site-lock/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, redirect }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Success - redirect to original page
        router.push(data.redirect);
        router.refresh();
      } else {
        // Show error
        setError(data.error || 'Incorrect password');
        setPassword(''); // Clear password field
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg border border-[#E5E5E0] p-8">
          {/* Logo */}
          <div className="mb-6 text-center">
            <Image
              src="/logo.png"
              alt="Site Logo"
              width={80}
              height={80}
              className="mx-auto"
            />
          </div>
          
          {/* Title */}
          <h1 className="text-2xl font-serif text-[#222] text-center mb-2">
            Password Protected
          </h1>
          <p className="text-[#666] text-center mb-6">
            This site requires a password to access
          </p>
          
          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                disabled={loading}
                className={
                  "w-full px-4 py-3 border rounded-lg " +
                  "focus:outline-none focus:ring-2 focus:ring-[#004D40] " +
                  "focus:border-transparent transition-all " +
                  "disabled:opacity-50 disabled:cursor-not-allowed " +
                  (error ? "border-red-500" : "border-[#E5E5E0]")
                }
              />
            </div>
            
            {/* Error message */}
            {error && (
              <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                {error}
              </div>
            )}
            
            {/* Submit button */}
            <button
              type="submit"
              disabled={loading || !password}
              className={
                "w-full bg-[#004D40] text-white py-3 rounded-lg " +
                "font-medium transition-all shadow-sm " +
                "hover:bg-[#00695C] " +
                "disabled:opacity-50 disabled:cursor-not-allowed"
              }
            >
              {loading ? 'Verifying...' : 'Access Site'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
```


### 7. Middleware Updates

**File**: `middleware.ts` (update existing)

```typescript
import { validatePasswordSession } from '@/lib/security/site-lock-session';

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  
  // ... existing subdomain logic ...
  
  // Skip settings checks for specific paths
  const isAdminPath = url.pathname.startsWith('/admin');
  const isAuthPath = url.pathname.startsWith('/auth');
  const isApiPath = url.pathname.startsWith('/api');
  const isMaintenancePage = url.pathname === '/maintenance';
  const isSiteLockPage = url.pathname === '/site-lock';
  
  if (isAdminPath || isAuthPath || isApiPath || isMaintenancePage || isSiteLockPage) {
    return await updateSession(request);
  }
  
  try {
    const settings = await settingsCache.get();
    
    // Get user and check if admin
    const supabase = createServerClient(/* ... */);
    const { data: { user } } = await supabase.auth.getUser();
    
    let isAdmin = false;
    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();
      isAdmin = profile?.role === 'ADMIN';
    }
    
    // Admins bypass all locks
    if (isAdmin) {
      return await updateSession(request);
    }
    
    // Maintenance Mode Check (takes precedence)
    if (settings.maintenance_mode) {
      return NextResponse.rewrite(new URL('/maintenance', request.url));
    }
    
    // Site Lock Check - Authentication Mode
    if (settings.site_lock_mode === 'auth' && !user) {
      const signInUrl = new URL('/auth/signin', request.url);
      signInUrl.searchParams.set('redirect', url.pathname);
      return NextResponse.redirect(signInUrl);
    }
    
    // Site Lock Check - Password Mode
    if (settings.site_lock_mode === 'password') {
      // Check if user has valid password session
      const hasValidSession = await validatePasswordSession(
        settings.site_lock_password_hash
      );
      
      if (!hasValidSession) {
        const siteLockUrl = new URL('/site-lock', request.url);
        siteLockUrl.searchParams.set('redirect', url.pathname);
        return NextResponse.redirect(siteLockUrl);
      }
    }
    
  } catch (error) {
    console.error('[Middleware] Settings error:', error);
    // Fail open - allow request through
  }
  
  return await updateSession(request);
}
```


### 8. Admin UI - Site Lock Control Component

**File**: `src/components/admin/settings/SiteLockControl.tsx`

```typescript
'use client';

import { useState } from 'react';
import { hashPassword } from '@/lib/security/password-hash';

interface SiteLockControlProps {
  currentMode: 'off' | 'auth' | 'password';
  onSave: (mode: string, passwordHash?: string) => Promise<void>;
  saving: boolean;
  error?: string;
}

export default function SiteLockControl({
  currentMode,
  onSave,
  saving,
  error,
}: SiteLockControlProps) {
  const [mode, setMode] = useState(currentMode);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  
  const handleModeChange = (newMode: string) => {
    setMode(newMode as 'off' | 'auth' | 'password');
    setIsDirty(true);
    setLocalError('');
  };
  
  const handleSave = async () => {
    setLocalError('');
    
    // Validate password if password mode is selected
    if (mode === 'password') {
      if (!password) {
        setLocalError('Password is required for password mode');
        return;
      }
      
      if (password.length < 8) {
        setLocalError('Password must be at least 8 characters');
        return;
      }
      
      if (password !== confirmPassword) {
        setLocalError('Passwords do not match');
        return;
      }
      
      // Hash password before saving
      try {
        const passwordHash = await hashPassword(password);
        await onSave(mode, passwordHash);
        setPassword('');
        setConfirmPassword('');
        setIsDirty(false);
      } catch (err) {
        setLocalError('Failed to save password');
      }
    } else {
      // No password needed for off or auth modes
      await onSave(mode);
      setIsDirty(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-[#E5E5E0] p-6">
      <div className="mb-4">
        <label className="block text-sm font-semibold text-[#222] mb-1">
          Site Lock Mode
        </label>
        <p className="text-sm text-[#666] mb-4">
          Control who can access your site
        </p>
        
        {/* Mode selection */}
        <div className="space-y-3">
          <label className="flex items-start cursor-pointer">
            <input
              type="radio"
              name="site_lock_mode"
              value="off"
              checked={mode === 'off'}
              onChange={(e) => handleModeChange(e.target.value)}
              className="mt-1 mr-3"
            />
            <div>
              <div className="font-medium text-[#222]">Off - Public Access</div>
              <div className="text-sm text-[#666]">
                Anyone can access the site without restrictions
              </div>
            </div>
          </label>
          
          <label className="flex items-start cursor-pointer">
            <input
              type="radio"
              name="site_lock_mode"
              value="auth"
              checked={mode === 'auth'}
              onChange={(e) => handleModeChange(e.target.value)}
              className="mt-1 mr-3"
            />
            <div>
              <div className="font-medium text-[#222]">Require Authentication</div>
              <div className="text-sm text-[#666]">
                Users must sign in with their accounts to access the site
              </div>
            </div>
          </label>
          
          <label className="flex items-start cursor-pointer">
            <input
              type="radio"
              name="site_lock_mode"
              value="password"
              checked={mode === 'password'}
              onChange={(e) => handleModeChange(e.target.value)}
              className="mt-1 mr-3"
            />
            <div>
              <div className="font-medium text-[#222]">Require Password</div>
              <div className="text-sm text-[#666]">
                Visitors must enter a shared password to access the site
              </div>
            </div>
          </label>
        </div>
      </div>
      
      {/* Password fields (only shown when password mode selected) */}
      {mode === 'password' && (
        <div className="mt-6 p-4 bg-[#F9F9F7] rounded-lg border border-[#E5E5E0]">
          <div className="mb-4">
            <label htmlFor="site_lock_password" className="block text-sm font-medium text-[#222] mb-2">
              Set Password
            </label>
            <input
              id="site_lock_password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setIsDirty(true);
              }}
              placeholder="Enter password (min 8 characters)"
              className="w-full px-4 py-2 border border-[#E5E5E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004D40]"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="site_lock_password_confirm" className="block text-sm font-medium text-[#222] mb-2">
              Confirm Password
            </label>
            <input
              id="site_lock_password_confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setIsDirty(true);
              }}
              placeholder="Confirm password"
              className="w-full px-4 py-2 border border-[#E5E5E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004D40]"
            />
          </div>
          
          <div className="text-sm text-[#C19A43] bg-yellow-50 border border-yellow-200 rounded px-3 py-2">
            ⚠️ Share this password securely. Anyone with the password can access the site.
          </div>
        </div>
      )}
      
      {/* Error message */}
      {(error || localError) && (
        <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error || localError}
        </div>
      )}
      
      {/* Save button */}
      {isDirty && (
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={
              "bg-[#004D40] text-white px-6 py-2 rounded-lg " +
              "hover:bg-[#00695C] transition-all font-medium shadow-sm " +
              "disabled:opacity-50 disabled:cursor-not-allowed"
            }
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}
    </div>
  );
}
```


### 9. Admin Banner Updates

**File**: `src/components/admin/AdminBanner.tsx` (update existing)

```typescript
'use client';

interface AdminBannerProps {
  maintenanceMode: boolean;
  siteLockMode: 'off' | 'auth' | 'password';
}

export default function AdminBanner({
  maintenanceMode,
  siteLockMode,
}: AdminBannerProps) {
  // Maintenance mode takes precedence
  if (maintenanceMode) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[100] bg-orange-500 text-white px-4 py-2 text-center text-sm font-medium">
        ⚠️ Maintenance Mode Active - Only admins can see this site
      </div>
    );
  }
  
  if (siteLockMode === 'auth') {
    return (
      <div className="fixed top-0 left-0 right-0 z-[100] bg-blue-600 text-white px-4 py-2 text-center text-sm font-medium">
        🔒 Site Lock Active - Authentication required for access
      </div>
    );
  }
  
  if (siteLockMode === 'password') {
    return (
      <div className="fixed top-0 left-0 right-0 z-[100] bg-blue-600 text-white px-4 py-2 text-center text-sm font-medium">
        🔒 Password Lock Active - Password required for access
      </div>
    );
  }
  
  return null;
}
```

Update layout.tsx to pass `siteLockMode` instead of `siteLockEnabled`:

```typescript
<AdminBanner
  maintenanceMode={settings.maintenance_mode}
  siteLockMode={settings.site_lock_mode}
/>
```


### 10. Settings API Updates

**File**: `src/app/api/admin/cms/settings/route.ts` (update existing)

Add special handling for site lock password:

```typescript
import { hashPassword } from '@/lib/security/password-hash';
import { invalidateAllPasswordSessions } from '@/lib/security/site-lock-session';

export async function PUT(request: NextRequest) {
  // ... existing auth checks ...
  
  const { key, value } = await request.json();
  
  // Special handling for site_lock_password_hash
  if (key === 'site_lock_password_hash') {
    // Value should be the plain password, we'll hash it
    if (typeof value !== 'string' || value.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }
    
    // Hash the password
    const hashedPassword = await hashPassword(value);
    
    // Save hashed password
    const { error } = await adminSupabase
      .from('cms_settings')
      .upsert({
        key: 'site_lock_password_hash',
        value_json: hashedPassword,
        updated_at: new Date().toISOString(),
      });
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Invalidate all existing password sessions
    invalidateAllPasswordSessions();
    
    // Invalidate settings cache
    settingsCache.invalidate();
    
    return NextResponse.json({ success: true });
  }
  
  // Special handling for site_lock_mode changes
  if (key === 'site_lock_mode') {
    // If changing away from password mode, invalidate sessions
    const currentSettings = await settingsCache.get();
    if (currentSettings.site_lock_mode === 'password' && value !== 'password') {
      invalidateAllPasswordSessions();
    }
  }
  
  // ... rest of existing logic ...
}
```


## Data Migration Strategy

### Migrating from site_lock_enabled to site_lock_mode

**Migration Script**: `src/lib/cms/migrate-site-lock.ts`

```typescript
import { createAdminClient } from '@/lib/supabase/server';

export async function migrateSiteLockSettings() {
  const supabase = await createAdminClient();
  
  // Check if old setting exists
  const { data: oldSetting } = await supabase
    .from('cms_settings')
    .select('*')
    .eq('key', 'site_lock_enabled')
    .single();
  
  if (!oldSetting) {
    console.log('No migration needed - site_lock_enabled not found');
    return;
  }
  
  // Determine new mode based on old value
  const newMode = oldSetting.value_json === true ? 'auth' : 'off';
  
  // Create new setting
  await supabase
    .from('cms_settings')
    .upsert({
      key: 'site_lock_mode',
      value_json: newMode,
      updated_at: new Date().toISOString(),
    });
  
  // Optionally delete old setting
  await supabase
    .from('cms_settings')
    .delete()
    .eq('key', 'site_lock_enabled');
  
  console.log(`Migrated site_lock_enabled (${oldSetting.value_json}) to site_lock_mode (${newMode})`);
}
```

**Run migration**: Call this function once during deployment or via admin panel.


## Security Considerations

### Password Storage
- **Never store plain text passwords**: Always use bcrypt with salt rounds ≥ 12
- **Hash on server**: Password hashing happens server-side only
- **Exclude from API responses**: Password hash never sent to client

### Session Security
- **HttpOnly cookies**: Prevent XSS attacks
- **Secure flag**: HTTPS only in production
- **SameSite=lax**: CSRF protection
- **Random tokens**: Cryptographically secure random bytes
- **Session validation**: Check password hash hasn't changed

### Rate Limiting
- **5 attempts per 15 minutes per IP**: Prevent brute force
- **429 status with Retry-After header**: Standard rate limit response
- **IP-based tracking**: Use x-forwarded-for or x-real-ip headers

### Admin Bypass
- **Server-side role check**: Admin status verified via database
- **No client-side bypass**: Cannot be manipulated by client
- **Consistent across all routes**: Middleware enforces uniformly

### CSRF Protection
- **Form submissions**: Use Next.js built-in CSRF protection
- **API routes**: Validate origin and referer headers

## Performance Considerations

### Session Storage
- **In-memory for single instance**: Fast, no external dependencies
- **Redis for production**: Distributed sessions across multiple instances
- **Session cleanup**: Periodic cleanup of expired sessions

### Middleware Performance
- **Cached settings**: No DB query on every request (5-minute TTL)
- **Early returns**: Skip checks for admin/auth/API routes
- **Minimal session validation**: Simple Map lookup

### Password Hashing
- **Async operations**: Don't block event loop
- **Appropriate cost factor**: Balance security and performance (12 rounds)
- **Hash only on password change**: Not on every verification

## Error Handling

### Password Verification Failures
```typescript
try {
  const isValid = await verifyPassword(password, hash);
  if (!isValid) {
    return { error: 'Incorrect password' }; // Generic message
  }
} catch (error) {
  console.error('Password verification error:', error);
  return { error: 'An error occurred' }; // Don't expose details
}
```

### Missing Configuration
```typescript
if (settings.site_lock_mode === 'password' && !settings.site_lock_password_hash) {
  console.error('Password mode enabled but no hash configured');
  // Fall back to disabled mode
  return await updateSession(request);
}
```

### Session Corruption
```typescript
try {
  const session = sessions.get(token);
  // ... validate session ...
} catch (error) {
  console.error('Session validation error:', error);
  // Delete corrupted session
  sessions.delete(token);
  return false;
}
```


## Testing Strategy

### Unit Tests

**Password Hashing** (`src/lib/security/password-hash.test.ts`):
- Test password hashing produces different hashes for same password
- Test password verification succeeds with correct password
- Test password verification fails with incorrect password
- Test minimum password length validation
- Test bcrypt error handling

**Session Management** (`src/lib/security/site-lock-session.test.ts`):
- Test session creation generates unique tokens
- Test session validation succeeds with valid token
- Test session validation fails with invalid token
- Test session validation fails when password hash changes
- Test session expiration after 7 days
- Test session invalidation clears all sessions

### Integration Tests

**Password Verification API** (`src/app/api/site-lock/verify/route.test.ts`):
- Test correct password returns success
- Test incorrect password returns 401
- Test missing password returns 400
- Test rate limiting blocks after 5 attempts
- Test rate limiting resets after 15 minutes
- Test session cookie is set on success

**Middleware Protection** (`middleware.test.ts`):
- Test password mode redirects to /site-lock without session
- Test password mode allows access with valid session
- Test admin bypasses password protection
- Test auth mode redirects to /auth/signin
- Test off mode allows public access
- Test maintenance mode takes precedence

### E2E Tests

**Password Lock Flow**:
1. Admin enables password mode and sets password
2. Unauthenticated user visits home page
3. User is redirected to /site-lock
4. User enters incorrect password → sees error
5. User enters correct password → redirected to home
6. User navigates to other pages → no prompt (session active)
7. Admin changes password
8. User's session is invalidated → prompted again

**Mode Switching**:
1. Admin enables auth mode
2. Unauthenticated user redirected to sign-in
3. Admin switches to password mode
4. Unauthenticated user redirected to password prompt
5. Admin disables site lock
6. Unauthenticated user accesses site freely


## Accessibility

### Password Prompt Page
- **Semantic HTML**: Proper form structure with labels
- **Keyboard navigation**: Tab order flows naturally
- **Screen reader support**: Labels associated with inputs via htmlFor
- **Error announcements**: Error messages in ARIA live regions
- **Focus management**: Focus password field on error
- **High contrast**: Sufficient color contrast ratios
- **Responsive design**: Works on all screen sizes

### Admin UI
- **Radio button labels**: Clear, descriptive labels for each mode
- **Help text**: Explanatory text for each option
- **Error messages**: Clear, actionable error messages
- **Loading states**: Disabled state during save operations
- **Success feedback**: Confirmation messages after save

## Monitoring and Logging

### Metrics to Track
- Password verification attempts (success/failure)
- Rate limit hits
- Session creation count
- Session validation failures
- Password changes
- Mode switches

### Logging Events
```typescript
// Password verification
console.log('[SiteLock] Password verification attempt', { ip, success: true });

// Rate limiting
console.warn('[SiteLock] Rate limit exceeded', { ip, attempts: 5 });

// Session creation
console.log('[SiteLock] Session created', { token: token.substring(0, 8) });

// Password change
console.log('[SiteLock] Password changed, invalidating all sessions');

// Configuration errors
console.error('[SiteLock] Password mode enabled but no hash configured');
```

## Future Enhancements

1. **Multiple Passwords**: Support multiple valid passwords for different user groups
2. **Password Expiration**: Automatically expire passwords after X days
3. **IP Whitelist**: Allow specific IPs to bypass password protection
4. **Time-Based Access**: Enable password protection only during certain hours
5. **Redis Sessions**: Distributed session storage for multi-instance deployments
6. **Audit Log**: Track all password access attempts with timestamps
7. **Email Notifications**: Notify admin of failed password attempts
8. **Custom Prompt Page**: Allow admins to customize the password prompt page
9. **Password Strength Meter**: Visual indicator of password strength in admin UI
10. **Two-Factor Authentication**: Add 2FA option for password mode

## Dependencies

### New Dependencies
```json
{
  "dependencies": {
    "bcryptjs": "^2.4.3"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6"
  }
}
```

### Existing Dependencies (already in project)
- `next`: Middleware, API routes, cookies
- `@supabase/ssr`: Database access
- `crypto`: Random token generation (Node.js built-in)

## Deployment Checklist

- [ ] Install bcryptjs dependency
- [ ] Run migration script to convert site_lock_enabled to site_lock_mode
- [ ] Update settings schema with new fields
- [ ] Deploy new middleware logic
- [ ] Deploy password prompt page
- [ ] Deploy password verification API
- [ ] Deploy admin UI updates
- [ ] Test password mode in staging
- [ ] Test auth mode still works
- [ ] Test admin bypass
- [ ] Test rate limiting
- [ ] Monitor logs for errors
- [ ] Document password sharing best practices for admins

## Rollback Plan

If issues arise:
1. Revert middleware changes (remove password mode check)
2. Revert settings schema (keep site_lock_enabled)
3. Remove password prompt page
4. Remove password verification API
5. Existing auth mode will continue to work
6. No data loss (password hashes remain in database)
