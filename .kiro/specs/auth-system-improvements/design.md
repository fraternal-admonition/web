# Design Document

## Overview

This design document outlines the improvements to the authentication system for the Fraternal Admonition application. The improvements focus on reliability, security, user experience, and proper integration with the Supabase database schema. The design addresses automatic session management, profile fetching reliability, enhanced error handling, and visual feedback improvements.

## Architecture

### Current Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  AuthContext │  │   Navbar     │  │  Auth Pages  │      │
│  │  (Provider)  │  │ (Consumer)   │  │  (Consumer)  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │
┌────────────────────────────┼─────────────────────────────────┐
│                      API Layer                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ /api/auth/*  │  │ /api/admin/* │  │  Middleware  │      │
│  │   Routes     │  │   Routes     │  │   (Session)  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
└─────────┼──────────────────┼──────────────────┼──────────────┘
          │                  │                  │
┌─────────┼──────────────────┼──────────────────┼──────────────┐
│         │         Supabase Layer              │              │
│  ┌──────▼──────┐  ┌──────────────┐  ┌────────▼────┐        │
│  │ Client SDK  │  │  Server SDK  │  │  Admin SDK  │        │
│  │ (Browser)   │  │  (SSR)       │  │ (Service)   │        │
│  └──────┬──────┘  └──────┬───────┘  └──────┬──────┘        │
│         │                │                  │                │
│         └────────────────┴──────────────────┘                │
│                          │                                   │
└──────────────────────────┼───────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────┐
│                   Database Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  auth.users  │  │auth.sessions │  │public.users  │      │
│  │auth.refresh_ │  │auth.identities│ │              │      │
│  │   tokens     │  │              │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└──────────────────────────────────────────────────────────────┘
```

### Improved Architecture

The improved architecture adds:
1. **Session Manager** - Centralized session lifecycle management
2. **Profile Cache** - Reduce redundant database queries
3. **Activity Tracker** - Monitor user interactions for session timeout
4. **Error Boundary** - Graceful error handling with retry logic
5. **State Machine** - Predictable auth state transitions

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  AuthContext │  │Session Manager│ │Activity Tracker│     │
│  │  (Enhanced)  │  │  (New)       │  │   (New)      │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│  ┌──────▼──────────────────▼──────────────────▼───────┐     │
│  │         Auth State Machine (New)                   │     │
│  │  States: INITIALIZING, AUTHENTICATED,              │     │
│  │          UNAUTHENTICATED, ERROR, EXPIRED           │     │
│  └────────────────────────────────────────────────────┘     │
│         │                                                    │
│  ┌──────▼──────────────────────────────────────────┐        │
│  │         Profile Cache (New)                     │        │
│  │  - Deduplicate requests                         │        │
│  │  - Cache profile data                           │        │
│  └─────────────────────────────────────────────────┘        │
└──────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Enhanced AuthContext

**Purpose:** Manage global authentication state with improved reliability and error handling.

**Interface:**
```typescript
interface AuthContextType {
  // State
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  error: AuthError | null;
  
  // Session info
  sessionExpiry: Date | null;
  lastActivity: Date | null;
  
  // Actions
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshSession: () => Promise<void>;
  clearError: () => void;
}

interface UserProfile {
  id: string;
  role: 'USER' | 'TESTER' | 'ADMIN';
  display_id: string | null;
  country: string | null;
  is_banned: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthError {
  code: string;
  message: string;
  retryable: boolean;
}
```

**Key Improvements:**
- Add error state with retry capability
- Track session expiry and last activity
- Expose session refresh method
- Add clear error method for dismissing errors

### 2. Session Manager

**Purpose:** Handle session lifecycle, expiration warnings, and automatic refresh.

**Interface:**
```typescript
class SessionManager {
  private expiryTimer: NodeJS.Timeout | null;
  private warningTimer: NodeJS.Timeout | null;
  private activityTimer: NodeJS.Timeout | null;
  
  constructor(
    private supabase: SupabaseClient,
    private onExpiry: () => void,
    private onWarning: () => void
  ) {}
  
  // Start monitoring session
  startMonitoring(session: Session): void;
  
  // Stop monitoring
  stopMonitoring(): void;
  
  // Record user activity
  recordActivity(): void;
  
  // Check if session is about to expire
  isNearExpiry(): boolean;
  
  // Refresh session
  async refreshSession(): Promise<Session | null>;
  
  // Get time until expiry
  getTimeUntilExpiry(): number;
}
```

**Implementation Details:**
- Monitor `auth.sessions.not_after` for expiration
- Set warning timer for 5 minutes before expiry
- Track user activity (clicks, navigation, API calls)
- Reset inactivity timer on activity (24-hour threshold)
- Automatically refresh session when near expiry

### 3. Profile Cache

**Purpose:** Reduce redundant profile fetches and prevent race conditions.

**Interface:**
```typescript
class ProfileCache {
  private cache: Map<string, CachedProfile>;
  private pendingRequests: Map<string, Promise<UserProfile | null>>;
  
  // Get profile with caching
  async getProfile(
    userId: string,
    supabase: SupabaseClient
  ): Promise<UserProfile | null>;
  
  // Invalidate cache for user
  invalidate(userId: string): void;
  
  // Clear all cache
  clear(): void;
  
  // Check if profile is cached
  has(userId: string): boolean;
}

interface CachedProfile {
  profile: UserProfile;
  timestamp: number;
  ttl: number; // Time to live in ms
}
```

**Implementation Details:**
- Cache profiles for 5 minutes
- Deduplicate concurrent requests for same user
- Automatically invalidate on profile updates
- Clear cache on sign out

### 4. Activity Tracker

**Purpose:** Monitor user activity to determine session inactivity.

**Interface:**
```typescript
class ActivityTracker {
  private lastActivity: Date;
  private inactivityThreshold: number; // 24 hours in ms
  private listeners: Set<() => void>;
  
  constructor(threshold?: number);
  
  // Start tracking
  start(): void;
  
  // Stop tracking
  stop(): void;
  
  // Record activity
  recordActivity(): void;
  
  // Check if inactive
  isInactive(): boolean;
  
  // Get last activity time
  getLastActivity(): Date;
  
  // Subscribe to activity events
  onActivity(callback: () => void): () => void;
}
```

**Implementation Details:**
- Listen to: mouse moves, clicks, keyboard events, navigation
- Throttle activity recording (max once per minute)
- Store last activity in localStorage for cross-tab sync
- Broadcast activity to other tabs via BroadcastChannel

### 5. Auth State Machine

**Purpose:** Manage predictable state transitions and prevent invalid states.

**States:**
```typescript
enum AuthState {
  INITIALIZING = 'INITIALIZING',
  AUTHENTICATED = 'AUTHENTICATED',
  UNAUTHENTICATED = 'UNAUTHENTICATED',
  ERROR = 'ERROR',
  EXPIRED = 'EXPIRED',
  SIGNING_OUT = 'SIGNING_OUT'
}

interface StateMachine {
  currentState: AuthState;
  
  // Transition to new state
  transition(newState: AuthState, data?: any): void;
  
  // Check if transition is valid
  canTransition(from: AuthState, to: AuthState): boolean;
  
  // Get current state
  getState(): AuthState;
  
  // Subscribe to state changes
  onStateChange(callback: (state: AuthState) => void): () => void;
}
```

**Valid Transitions:**
```
INITIALIZING → AUTHENTICATED | UNAUTHENTICATED | ERROR
AUTHENTICATED → EXPIRED | SIGNING_OUT | ERROR
UNAUTHENTICATED → AUTHENTICATED | ERROR
ERROR → INITIALIZING | UNAUTHENTICATED
EXPIRED → UNAUTHENTICATED | AUTHENTICATED
SIGNING_OUT → UNAUTHENTICATED
```

### 6. Enhanced Middleware

**Purpose:** Validate sessions and check ban status on every request.

**Improvements:**
- Cache user role/ban status for 1 minute to reduce DB queries
- Use service role only for ban checks (not for every request)
- Add request ID for debugging
- Log suspicious activity (multiple failed auth attempts)

**Implementation:**
```typescript
// Middleware cache
const userStatusCache = new Map<string, {
  is_banned: boolean;
  role: string;
  timestamp: number;
}>();

async function updateSession(request: NextRequest) {
  const requestId = crypto.randomUUID();
  
  // Create Supabase client
  const supabase = createServerClient(/* ... */);
  
  // Get user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    // Check cache first
    const cached = userStatusCache.get(user.id);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < 60000) {
      // Use cached status
      if (cached.is_banned) {
        await supabase.auth.signOut();
        return NextResponse.redirect(new URL('/auth/banned', request.url));
      }
    } else {
      // Fetch fresh status
      const { data: userData } = await supabase
        .from('users')
        .select('is_banned, role')
        .eq('id', user.id)
        .single();
      
      if (userData) {
        // Update cache
        userStatusCache.set(user.id, {
          is_banned: userData.is_banned,
          role: userData.role,
          timestamp: now
        });
        
        if (userData.is_banned) {
          await supabase.auth.signOut();
          return NextResponse.redirect(new URL('/auth/banned', request.url));
        }
      }
    }
  }
  
  return supabaseResponse;
}
```

### 7. Enhanced requireAdmin Helper

**Purpose:** Server-side admin authentication with caching.

**Improvements:**
- Cache admin status within request context
- Return user data to avoid duplicate queries
- Add detailed error messages
- Support redirect parameter

**Implementation:**
```typescript
export async function requireAdmin(redirectTo?: string) {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  if (!user) {
    const redirectUrl = redirectTo 
      ? `/auth/signin?redirect=${encodeURIComponent(redirectTo)}`
      : '/auth/signin?redirect=/admin';
    redirect(redirectUrl);
  }
  
  // Fetch user data
  const { data: userData, error } = await supabase
    .from('users')
    .select('role, is_banned')
    .eq('id', user.id)
    .single();
  
  if (error || !userData) {
    console.error('[requireAdmin] Failed to fetch user data:', error);
    redirect('/');
  }
  
  if (userData.is_banned) {
    redirect('/auth/banned');
  }
  
  if (userData.role !== 'ADMIN') {
    redirect('/dashboard');
  }
  
  return { user, userData };
}
```

## Data Models

### Session Data Structure

```typescript
interface SessionData {
  // From auth.sessions
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  not_after: string | null; // Expiry timestamp
  refreshed_at: string | null;
  user_agent: string | null;
  ip: string | null;
  
  // Computed
  isExpired: boolean;
  isNearExpiry: boolean;
  timeUntilExpiry: number;
}
```

### User Profile Data Structure

```typescript
interface UserProfile {
  // From public.users
  id: string; // FK to auth.users.id
  role: 'USER' | 'TESTER' | 'ADMIN';
  display_id: string | null;
  country: string | null;
  is_banned: boolean;
  created_at: string;
  updated_at: string;
  
  // From auth.users (joined)
  email: string;
  email_confirmed_at: string | null;
  last_sign_in_at: string | null;
}
```

### Auth Error Data Structure

```typescript
interface AuthError {
  code: string;
  message: string;
  retryable: boolean;
  timestamp: Date;
  context?: {
    operation: string;
    userId?: string;
    details?: any;
  };
}

// Error codes
enum AuthErrorCode {
  PROFILE_FETCH_FAILED = 'PROFILE_FETCH_FAILED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  BANNED_USER = 'BANNED_USER',
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}
```

## Error Handling

### Error Classification

**Retryable Errors:**
- Network timeouts
- Temporary server errors (5xx)
- Rate limiting (429)
- Profile fetch failures

**Non-Retryable Errors:**
- Invalid credentials
- Banned user
- Email not verified
- Unauthorized access

### Retry Strategy

```typescript
interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2
};

async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  config: RetryConfig = defaultRetryConfig
): Promise<T> {
  let lastError: Error;
  let delay = config.initialDelay;
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < config.maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * config.backoffMultiplier, config.maxDelay);
      }
    }
  }
  
  throw lastError!;
}
```

### Error Display

**Toast Notifications:**
- Use react-hot-toast for non-blocking notifications
- Auto-dismiss after 5 seconds for info/success
- Manual dismiss for errors
- Include retry button for retryable errors

**Error Pages:**
- /auth/auth-error - Generic auth errors with retry
- /auth/banned - Account banned message
- /auth/expired - Session expired, please sign in again

## Testing Strategy

### Unit Tests

**AuthContext Tests:**
- State initialization
- Sign in/out flows
- Profile fetching with retries
- Error handling
- Session expiry detection

**SessionManager Tests:**
- Expiry timer setup
- Warning notifications
- Activity tracking
- Session refresh

**ProfileCache Tests:**
- Cache hit/miss
- Request deduplication
- Cache invalidation
- TTL expiration

**ActivityTracker Tests:**
- Activity recording
- Inactivity detection
- Cross-tab synchronization
- Event throttling

### Integration Tests

**Auth Flow Tests:**
- Complete sign up flow
- Complete sign in flow (email/password)
- OAuth sign in flow (Google)
- Sign out flow
- Session restoration on page refresh

**Protected Route Tests:**
- Unauthenticated access to /dashboard
- Unauthenticated access to /admin
- Non-admin access to /admin
- Banned user access to any route
- Admin access to /admin

**Middleware Tests:**
- Session validation
- Ban status checking
- Cache behavior
- Redirect logic

### End-to-End Tests

**User Scenarios:**
1. New user signs up → verifies email → signs in → accesses dashboard
2. Existing user signs in → session expires → gets warning → refreshes → continues
3. User signs in → becomes inactive → auto signs out after 24 hours
4. Admin signs in → accesses admin panel → role revoked → redirected to dashboard
5. User gets banned → middleware catches → signed out → redirected to banned page

**Cross-Tab Scenarios:**
1. User signs in on Tab A → Tab B recognizes session
2. User signs out on Tab A → Tab B also signs out
3. User active on Tab A → Tab B doesn't timeout
4. Session expires on Tab A → Tab B also expires

## Performance Considerations

### Optimization Strategies

**1. Profile Caching:**
- Cache profiles for 5 minutes
- Reduce database queries by ~90%
- Invalidate on updates

**2. Middleware Caching:**
- Cache ban status for 1 minute
- Reduce service role queries
- Balance security vs performance

**3. Request Deduplication:**
- Prevent duplicate profile fetches
- Use in-flight request tracking
- Share results across concurrent requests

**4. Lazy Loading:**
- Don't fetch profile until needed
- Defer non-critical data
- Progressive enhancement

**5. Code Splitting:**
- Separate auth components
- Load session manager on demand
- Reduce initial bundle size

### Performance Metrics

**Target Metrics:**
- Initial auth check: < 100ms
- Profile fetch: < 200ms
- Sign in: < 1s
- Sign out: < 500ms
- Session refresh: < 300ms

**Monitoring:**
- Track auth operation durations
- Monitor error rates
- Alert on high latency
- Dashboard for auth metrics

## Security Considerations

### Session Security

**1. Secure Cookie Settings:**
```typescript
{
  httpOnly: true,
  secure: true, // HTTPS only
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 // 7 days
}
```

**2. CSRF Protection:**
- Use Supabase's built-in CSRF protection
- Validate state parameter in OAuth flows
- Check origin header in API routes

**3. XSS Prevention:**
- Sanitize user input
- Use Content Security Policy
- Escape output in templates

### Data Protection

**1. Sensitive Data:**
- Never log passwords or tokens
- Redact email in client logs
- Encrypt sensitive data at rest

**2. RLS Policies:**
- Users can only read their own profile
- Only service role can check ban status
- Admins can read all profiles

**3. Rate Limiting:**
- Limit sign in attempts (5 per 15 minutes)
- Limit profile fetches (10 per minute)
- Limit session refreshes (1 per minute)

## Migration Strategy

### Phase 1: Foundation (Week 1)
- Implement SessionManager
- Implement ProfileCache
- Implement ActivityTracker
- Add unit tests

### Phase 2: Integration (Week 2)
- Enhance AuthContext with new components
- Update middleware with caching
- Enhance requireAdmin helper
- Add integration tests

### Phase 3: UI Improvements (Week 3)
- Add loading states to Navbar
- Add session expiry warnings
- Improve error messages
- Add retry buttons

### Phase 4: Testing & Refinement (Week 4)
- End-to-end testing
- Performance testing
- Security audit
- Bug fixes

### Rollback Plan

**If issues arise:**
1. Feature flags to disable new features
2. Revert to previous AuthContext
3. Keep database schema unchanged
4. Monitor error rates closely

## Monitoring and Observability

### Logging

**Client-Side:**
```typescript
// Structured logging
logger.info('auth.signin.start', { method: 'email' });
logger.info('auth.signin.success', { userId: user.id });
logger.error('auth.signin.failed', { error: error.code });
```

**Server-Side:**
```typescript
// Request logging
console.log(`[${requestId}] Auth check for user ${userId}`);
console.log(`[${requestId}] Ban status: ${isBanned}`);
console.error(`[${requestId}] Error: ${error.message}`);
```

### Metrics

**Track:**
- Sign in success/failure rate
- Profile fetch duration
- Session refresh rate
- Error rates by type
- Cache hit rate

### Alerts

**Set up alerts for:**
- Error rate > 5%
- Auth latency > 2s
- Cache hit rate < 80%
- Multiple failed sign in attempts
- Unusual ban rate

## Future Enhancements

### Phase 2 Features (Post-MVP)

**1. Multi-Factor Authentication:**
- TOTP support
- SMS verification
- Backup codes

**2. Session Management UI:**
- View active sessions
- Revoke sessions remotely
- See login history

**3. Security Notifications:**
- Email on new device login
- Alert on suspicious activity
- Password change notifications

**4. Advanced Session Controls:**
- Remember me option
- Configurable session duration
- Device fingerprinting

**5. Audit Logging:**
- Track all auth events
- Admin audit trail
- Compliance reporting
