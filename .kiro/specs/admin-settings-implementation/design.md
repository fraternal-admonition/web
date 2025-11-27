# Design Document

## Overview

This design implements the functional behavior for three critical admin settings: site_name, maintenance_mode, and site_lock_enabled. The implementation uses middleware for request interception, server-side settings fetching with caching, and React components for admin indicators. The design prioritizes performance through caching, reliability through fallbacks, and user experience through clear visual feedback.

### Key Design Principles

1. **Middleware-First**: Use Next.js middleware to intercept requests before they reach page components
2. **Server-Side Settings**: Fetch settings on the server to avoid client-side flicker
3. **Efficient Caching**: Cache settings in memory with automatic invalidation
4. **Graceful Degradation**: Always have fallback values if settings fail to load
5. **Admin Transparency**: Show clear indicators to admins when special modes are active
6. **Zero Client Secrets**: Never expose sensitive logic or bypass mechanisms to the client

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
│  1. Check if user is admin                               │
│  2. Fetch settings (cached)                              │
│  3. Apply maintenance mode check                         │
│  4. Apply site lock check                                │
│  5. Continue or redirect                                 │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    Page Component                        │
│  1. Fetch settings for site name                         │
│  2. Render admin banners if needed                       │
│  3. Set page metadata                                    │
└─────────────────────────────────────────────────────────┘
```

### Component Architecture

```
middleware.ts
├── getSettings() → SettingsCache
├── isUserAdmin() → Auth Check
├── checkMaintenanceMode() → Redirect or Continue
└── checkSiteLock() → Redirect or Continue


src/lib/cms/settings-cache.ts
├── SettingsCache class
│   ├── get() → Cached settings or fetch from DB
│   ├── invalidate() → Clear cache
│   └── set() → Update cache
└── getPublicSettings() → Safe subset for client

src/components/admin/AdminBanner.tsx
├── MaintenanceModeBanner
└── SiteLockBanner

src/app/layout.tsx
├── fetchSettings() → Get site name
├── generateMetadata() → Set title and meta tags
└── <AdminBanner /> → Show indicators
```

## Components and Interfaces

### 1. Settings Cache Service

**File**: `src/lib/cms/settings-cache.ts`

This service provides an in-memory cache for settings with automatic expiration and invalidation.

```typescript
interface CachedSettings {
  site_name: string;
  maintenance_mode: boolean;
  site_lock_enabled: boolean;
  max_upload_size_mb: number;
  contact_email: string;
}

interface CacheEntry {
  data: CachedSettings;
  timestamp: number;
}

class SettingsCache {
  private cache: CacheEntry | null = null;
  private readonly TTL = 5 * 60 * 1000; // 5 minutes
  
  async get(): Promise<CachedSettings>;
  invalidate(): void;
  isExpired(): boolean;
}
```

**Key Features:**
- In-memory cache with 5-minute TTL
- Automatic expiration checking
- Manual invalidation on updates
- Fallback to defaults on error



### 2. Middleware Settings Integration

**File**: `middleware.ts` (update existing)

The middleware will be enhanced to check settings and enforce maintenance mode and site lock.

```typescript
// Pseudo-code structure
export async function middleware(request: NextRequest) {
  // ... existing subdomain logic ...
  
  // Skip settings checks for admin routes, auth routes, and API routes
  if (isAdminPath || isAuthPath || isApiPath) {
    return await updateSession(request);
  }
  
  // Fetch settings (cached)
  const settings = await settingsCache.get();
  
  // Check if user is admin
  const { user } = await getUser(request);
  const isAdmin = user?.role === 'ADMIN';
  
  // Maintenance Mode Check (takes precedence)
  if (settings.maintenance_mode && !isAdmin) {
    return NextResponse.rewrite(new URL('/maintenance', request.url));
  }
  
  // Site Lock Check
  if (settings.site_lock_enabled && !user) {
    const signInUrl = new URL('/auth/signin', request.url);
    signInUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }
  
  // Continue with normal flow
  return await updateSession(request);
}
```

**Key Decisions:**
- Maintenance mode takes precedence over site lock
- Admin routes always bypass both checks
- Auth routes always bypass both checks (to allow sign-in)
- API routes are handled separately
- Settings are cached to avoid DB query on every request



### 3. Maintenance Page

**File**: `src/app/maintenance/page.tsx`

A dedicated maintenance page that non-admin users see when maintenance mode is active.

```typescript
export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <Image 
            src="/logo.png" 
            alt="Fraternal Admonition" 
            width={120} 
            height={120}
            className="mx-auto"
          />
        </div>
        
        <h1 className="text-3xl font-serif text-[#222] mb-4">
          Under Maintenance
        </h1>
        
        <p className="text-[#666] mb-6">
          We're currently performing scheduled maintenance to improve your experience.
          Please check back soon.
        </p>
        
        <div className="text-sm text-[#999]">
          Thank you for your patience.
        </div>
      </div>
    </div>
  );
}
```

**Design Notes:**
- Clean, branded design matching site aesthetic
- No navigation or interactive elements
- Professional and reassuring tone
- Responsive layout



### 4. Admin Banner Component

**File**: `src/components/admin/AdminBanner.tsx`

A banner component that shows at the top of pages when special modes are active (only visible to admins).

```typescript
'use client';

interface AdminBannerProps {
  maintenanceMode: boolean;
  siteLockEnabled: boolean;
}

export default function AdminBanner({ maintenanceMode, siteLockEnabled }: AdminBannerProps) {
  // Maintenance mode takes precedence
  if (maintenanceMode) {
    return (
      <div className="bg-orange-500 text-white px-4 py-2 text-center text-sm font-medium">
        ⚠️ Maintenance Mode Active - Only admins can see this site
      </div>
    );
  }
  
  if (siteLockEnabled) {
    return (
      <div className="bg-blue-600 text-white px-4 py-2 text-center text-sm font-medium">
        🔒 Site Lock Active - Only authenticated users can access
      </div>
    );
  }
  
  return null;
}
```

**Usage in Layout:**
```typescript
// src/app/layout.tsx
export default async function RootLayout({ children }) {
  const user = await getUser();
  const isAdmin = user?.role === 'ADMIN';
  const settings = await settingsCache.get();
  
  return (
    <html>
      <body>
        {isAdmin && (
          <AdminBanner 
            maintenanceMode={settings.maintenance_mode}
            siteLockEnabled={settings.site_lock_enabled}
          />
        )}
        {children}
      </body>
    </html>
  );
}
```



### 5. Site Name Implementation

**File**: `src/app/layout.tsx` (update metadata)

The site name will be used in page titles and meta tags throughout the site.

```typescript
import { settingsCache } from '@/lib/cms/settings-cache';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await settingsCache.get();
  
  return {
    title: {
      default: settings.site_name,
      template: `%s | ${settings.site_name}`,
    },
    description: 'A platform for thoughtful discourse and creative expression',
    openGraph: {
      siteName: settings.site_name,
      type: 'website',
    },
  };
}
```

**Page-Level Titles:**
```typescript
// src/app/about/page.tsx
export const metadata = {
  title: 'About Us', // Will become "About Us | Fraternal Admonition"
};
```

**Dynamic Titles:**
```typescript
// src/app/blog/[slug]/page.tsx
export async function generateMetadata({ params }) {
  const post = await getPost(params.slug);
  return {
    title: post.title, // Will become "{Post Title} | Fraternal Admonition"
  };
}
```



### 6. API Route Protection

**File**: `src/lib/middleware/api-protection.ts`

Helper functions to protect API routes based on settings.

```typescript
export async function checkMaintenanceMode(request: NextRequest) {
  const settings = await settingsCache.get();
  
  if (!settings.maintenance_mode) {
    return null; // No maintenance mode
  }
  
  // Check if user is admin
  const { user } = await getUser(request);
  if (user?.role === 'ADMIN') {
    return null; // Admin can access
  }
  
  // Return 503 Service Unavailable
  return NextResponse.json(
    { error: 'Service temporarily unavailable for maintenance' },
    { status: 503, headers: { 'Retry-After': '3600' } }
  );
}

export async function checkSiteLock(request: NextRequest) {
  const settings = await settingsCache.get();
  
  if (!settings.site_lock_enabled) {
    return null; // No site lock
  }
  
  // Check if user is authenticated
  const { user } = await getUser(request);
  if (user) {
    return null; // Authenticated user can access
  }
  
  // Return 401 Unauthorized
  return NextResponse.json(
    { error: 'Authentication required' },
    { status: 401 }
  );
}
```

**Usage in API Routes:**
```typescript
// src/app/api/public/route.ts
export async function GET(request: NextRequest) {
  // Check maintenance mode
  const maintenanceCheck = await checkMaintenanceMode(request);
  if (maintenanceCheck) return maintenanceCheck;
  
  // Check site lock
  const siteLockCheck = await checkSiteLock(request);
  if (siteLockCheck) return siteLockCheck;
  
  // Continue with normal logic
  return NextResponse.json({ data: 'public data' });
}
```



### 7. Cache Invalidation

**File**: `src/app/api/admin/cms/settings/[key]/route.ts` (update existing)

When a setting is updated, the cache must be invalidated immediately.

```typescript
import { settingsCache } from '@/lib/cms/settings-cache';

export async function PUT(request: NextRequest, { params }) {
  // ... existing validation and update logic ...
  
  // After successful update
  const { data: updatedSetting, error } = await adminSupabase
    .from("cms_settings")
    .upsert({ key, value_json: value, updated_at: new Date().toISOString() })
    .select()
    .single();
  
  if (!error) {
    // Invalidate cache immediately
    settingsCache.invalidate();
  }
  
  // ... rest of the logic ...
}
```

**Cache Invalidation Strategy:**
- Invalidate on any setting update
- Cache rebuilds on next request
- No need for complex cache keys since we cache all settings together



## Data Models

### Settings Cache Structure

```typescript
interface CachedSettings {
  site_name: string;
  maintenance_mode: boolean;
  site_lock_enabled: boolean;
  max_upload_size_mb: number;
  contact_email: string;
}
```

### Database Schema

No changes to existing `cms_settings` table. Current structure:

```sql
CREATE TABLE cms_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## Error Handling

### Settings Load Failure

```typescript
async get(): Promise<CachedSettings> {
  try {
    // Try to fetch from database
    const settings = await fetchFromDatabase();
    return settings;
  } catch (error) {
    console.error('Failed to load settings:', error);
    // Return defaults from schema
    return {
      site_name: 'Fraternal Admonition',
      maintenance_mode: false,
      site_lock_enabled: false,
      max_upload_size_mb: 10,
      contact_email: '',
    };
  }
}
```



### Middleware Error Handling

```typescript
// If settings fail to load in middleware, allow request through
// Better to have a working site than block everything
try {
  const settings = await settingsCache.get();
  // ... apply checks ...
} catch (error) {
  console.error('Middleware settings error:', error);
  // Continue with request (fail open)
  return await updateSession(request);
}
```

## Testing Strategy

### Unit Tests

1. **Settings Cache**
   - Test cache hit/miss
   - Test TTL expiration
   - Test invalidation
   - Test fallback to defaults

2. **Middleware Logic**
   - Test maintenance mode redirect for non-admin
   - Test maintenance mode bypass for admin
   - Test site lock redirect for unauthenticated
   - Test site lock bypass for authenticated

### Integration Tests

1. **Maintenance Mode Flow**
   - Enable maintenance mode via API
   - Verify non-admin sees maintenance page
   - Verify admin sees normal site with banner
   - Disable maintenance mode
   - Verify all users see normal site

2. **Site Lock Flow**
   - Enable site lock via API
   - Verify unauthenticated user redirected to sign-in
   - Sign in as regular user
   - Verify access granted
   - Disable site lock
   - Verify unauthenticated access works



3. **Site Name Flow**
   - Update site name via API
   - Verify browser title updates on home page
   - Verify browser title updates on other pages
   - Verify meta tags include new site name

### E2E Tests

1. Admin enables maintenance mode → Non-admin user sees maintenance page
2. Admin enables site lock → Unauthenticated user redirected to sign-in
3. Admin changes site name → Browser title updates across site
4. Settings cache invalidates on update → Changes take effect immediately

## Performance Considerations

### Caching Strategy

- **In-Memory Cache**: Fast access, no external dependencies
- **5-Minute TTL**: Balance between freshness and performance
- **Single Cache Entry**: All settings cached together (they're small)
- **Lazy Loading**: Cache populated on first request

### Middleware Performance

- **Cached Settings**: No DB query on every request
- **Early Returns**: Skip checks for admin/auth/API routes
- **Minimal Logic**: Simple boolean checks, no complex operations

### Database Impact

- **Read-Heavy**: Settings are read frequently but updated rarely
- **No Joins**: Simple key-value lookups
- **Indexed Key**: Unique constraint on key provides index



## Security Considerations

### Maintenance Mode

- **Admin Bypass**: Admins can always access (checked server-side)
- **No Client Bypass**: No way for non-admins to bypass via client manipulation
- **API Protection**: API routes also respect maintenance mode

### Site Lock

- **Authentication Required**: Checked server-side via session
- **Redirect Preservation**: Return URL preserved for post-login redirect
- **No Token Exposure**: No sensitive data in URLs or client code

### Settings Access

- **Admin-Only Updates**: Only admins can change settings
- **Audit Logging**: All setting changes logged
- **No Client Secrets**: Settings cache is server-side only

## Migration Strategy

### Phase 1: Add Settings Cache (Non-Breaking)

1. Create `settings-cache.ts` with caching logic
2. Test cache independently
3. No user-facing changes yet

### Phase 2: Implement Site Name

1. Update root layout to use site name from settings
2. Test browser titles and meta tags
3. Low risk, purely additive

### Phase 3: Implement Maintenance Mode

1. Create maintenance page
2. Update middleware to check maintenance mode
3. Add admin banner component
4. Test with maintenance mode disabled (no impact)
5. Test enabling maintenance mode



### Phase 4: Implement Site Lock

1. Update middleware to check site lock
2. Update sign-in page to show site lock message
3. Test with site lock disabled (no impact)
4. Test enabling site lock

### Phase 5: API Route Protection

1. Create API protection helpers
2. Update public API routes to use helpers
3. Test API behavior with settings enabled/disabled

## Design Patterns

### Middleware Pattern

Using Next.js middleware for request interception provides:
- Early request handling before page rendering
- Consistent enforcement across all routes
- Ability to redirect or rewrite requests
- Access to request context (user, headers, etc.)

### Cache-Aside Pattern

Settings cache uses cache-aside pattern:
- Check cache first
- On miss, fetch from database
- Store in cache for future requests
- Invalidate on updates

### Fail-Open Pattern

If settings fail to load:
- Use default values (maintenance off, site lock off)
- Log error for monitoring
- Allow site to function normally
- Better to have working site than broken site



## Accessibility

### Maintenance Page

- Semantic HTML structure
- Proper heading hierarchy
- Sufficient color contrast
- Responsive design for all screen sizes
- Alt text for logo image

### Admin Banners

- High contrast colors for visibility
- Clear, concise messaging
- Positioned at top for immediate visibility
- Does not interfere with page content
- Screen reader accessible

## Future Enhancements

1. **Custom Maintenance Message**: Allow admins to set custom maintenance message
2. **Scheduled Maintenance**: Set maintenance mode to activate at specific time
3. **Maintenance End Time**: Display estimated return time on maintenance page
4. **Whitelist IPs**: Allow specific IPs to bypass site lock
5. **Role-Based Site Lock**: Allow specific roles to bypass site lock
6. **Redis Cache**: Use Redis for distributed caching in multi-instance deployments
7. **Settings Webhooks**: Notify external services when settings change
8. **Settings History**: Track history of setting changes over time

## Monitoring and Observability

### Metrics to Track

- Settings cache hit rate
- Settings load time
- Maintenance mode activations
- Site lock activations
- Failed settings loads

### Logging

- Log when maintenance mode is enabled/disabled
- Log when site lock is enabled/disabled
- Log when settings fail to load
- Log cache invalidations

 