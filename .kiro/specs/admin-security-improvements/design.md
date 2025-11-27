# Design Document

## Overview

This design document outlines the technical approach for implementing critical security improvements and high-priority enhancements to the admin panel. The design focuses on addressing security vulnerabilities, improving data integrity, and enhancing the robustness of admin operations.

## Architecture

### Security Layer Architecture

The security architecture follows a defense-in-depth approach with multiple layers:

1. **Middleware Layer**: Session validation, subdomain routing, rate limiting
2. **Server Component Layer**: Authentication checks via requireAdmin()
3. **API Route Layer**: Authorization, input validation, CSRF protection, audit logging
4. **Database Layer**: RLS policies, admin client with service role (post-auth only)

### Key Architectural Decisions

**Decision 1: Convert Client Components to Server Components**
- Rationale: Client-side auth checks can be bypassed; server-side is more secure
- Impact: Pages list and settings pages will be converted to server components
- Trade-off: Slightly less interactive, but significantly more secure

**Decision 2: Dual Client Pattern**
- Rationale: Use regular client for auth checks, admin client only after verification
- Impact: All API routes will check auth with regular client first
- Trade-off: Slight performance overhead, but prevents privilege escalation

**Decision 3: HTML Sanitization at Save Time**
- Rationale: Sanitize on save rather than render to prevent stored XSS
- Impact: Use DOMPurify or similar library server-side
- Trade-off: Cannot store certain HTML elements, but prevents XSS attacks


## Components and Interfaces

### 1. Authentication & Authorization Components

#### `requireAdmin()` Enhancement
```typescript
// src/lib/admin-auth.ts
export async function requireAdmin(redirectTo?: string): Promise<AdminAuthResult> {
  // Check session validity
  // Check user role
  // Check if banned
  // Log access attempt
  // Return user data or redirect
}
```

#### `checkAdminAuth()` Helper for API Routes
```typescript
// src/lib/admin-auth.ts
export async function checkAdminAuth(): Promise<AuthCheckResult> {
  // Reusable auth check for API routes
  // Returns { authorized: boolean, user?, error?, status? }
}
```

### 2. Input Validation & Sanitization

#### HTML Sanitizer
```typescript
// src/lib/security/sanitize.ts
export function sanitizeHTML(html: string): string {
  // Use isomorphic-dompurify
  // Configure allowed tags and attributes
  // Return sanitized HTML
}
```

#### Input Validators
```typescript
// src/lib/security/validators.ts
export function validateSlug(slug: string): ValidationResult
export function validateJSON(json: string): ValidationResult
export function validateURL(url: string): ValidationResult
```

### 3. CSRF Protection

#### CSRF Token Manager
```typescript
// src/lib/security/csrf.ts
export async function generateCSRFToken(userId: string): Promise<string>
export async function validateCSRFToken(token: string, userId: string): Promise<boolean>
```

Implementation approach:
- Store tokens in Redis or Supabase with expiry
- Include token in forms and validate on submission
- Use double-submit cookie pattern as fallback


### 4. Rate Limiting

#### Rate Limiter Implementation
```typescript
// src/lib/security/rate-limit.ts
export class RateLimiter {
  async checkLimit(identifier: string, limit: number, window: number): Promise<RateLimitResult>
  async recordRequest(identifier: string): Promise<void>
}
```

Strategy:
- Use Upstash Redis for distributed rate limiting
- Fallback to in-memory Map for development
- Implement sliding window algorithm
- Rate limits: 100 requests/minute per user, 1000 requests/hour per IP

### 5. Audit Logging

#### Audit Logger
```typescript
// src/lib/security/audit-log.ts
export async function logAuditEvent(event: AuditEvent): Promise<void>

interface AuditEvent {
  user_id: string
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW'
  resource_type: 'cms_page' | 'cms_asset' | 'cms_setting'
  resource_id: string
  changes?: Record<string, any>
  ip_address?: string
  user_agent?: string
  timestamp: string
}
```

### 6. Auto-Save Manager

#### Debounced Auto-Save
```typescript
// src/lib/cms/auto-save.ts
export class AutoSaveManager {
  private saveTimeout: NodeJS.Timeout | null
  private saveQueue: SaveRequest[]
  private isSaving: boolean
  
  scheduleSave(data: SaveData, delay: number): void
  cancelPendingSaves(): void
  forceSave(): Promise<void>
}
```

Strategy:
- Debounce saves with 30-second delay
- Queue saves if one is in progress
- Cancel on manual save
- Retry with exponential backoff on failure


### 7. Error Handling System

#### Centralized Error Handler
```typescript
// src/lib/errors/handler.ts
export class AdminError extends Error {
  code: string
  statusCode: number
  userMessage: string
  logDetails: Record<string, any>
}

export function handleAPIError(error: unknown): NextResponse
export function formatUserError(error: AdminError): string
```

Error categories:
- Authentication errors (401)
- Authorization errors (403)
- Validation errors (400)
- Not found errors (404)
- Rate limit errors (429)
- Server errors (500)

### 8. Session Management

#### Enhanced Session Validator
```typescript
// src/lib/auth/session.ts
export async function validateAdminSession(request: NextRequest): Promise<SessionResult>
export async function extendSession(userId: string): Promise<void>
export async function invalidateSession(userId: string): Promise<void>
```

Features:
- 30-minute inactivity timeout
- Automatic extension on activity
- Secure session storage
- Session invalidation on sign-out


## Data Models

### Audit Logs Table

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'VIEW')),
  resource_type TEXT NOT NULL CHECK (resource_type IN ('cms_page', 'cms_asset', 'cms_setting')),
  resource_id UUID NOT NULL,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
```

### CSRF Tokens Table (if not using Redis)

```sql
CREATE TABLE csrf_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_csrf_tokens_user_id ON csrf_tokens(user_id);
CREATE INDEX idx_csrf_tokens_token ON csrf_tokens(token);
CREATE INDEX idx_csrf_tokens_expires_at ON csrf_tokens(expires_at);
```

### Rate Limit Tracking (if not using Redis)

```sql
CREATE TABLE rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL, -- user_id or IP address
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rate_limits_identifier ON rate_limits(identifier);
CREATE INDEX idx_rate_limits_window ON rate_limits(window_end);
```


### Updated CMS Pages Table

```sql
-- Add columns if not exists
ALTER TABLE cms_pages 
  ADD COLUMN IF NOT EXISTS draft_content_json JSONB,
  ADD COLUMN IF NOT EXISTS reading_time INTEGER;

-- Ensure proper indexes
CREATE INDEX IF NOT EXISTS idx_cms_pages_slug ON cms_pages(slug);
CREATE INDEX IF NOT EXISTS idx_cms_pages_published ON cms_pages(published);
```

## Error Handling

### Error Flow

1. **API Route Error Handling**
```typescript
try {
  // Operation
} catch (error) {
  logError(error, context)
  return handleAPIError(error)
}
```

2. **Client Error Display**
- Show user-friendly messages
- Log full error details to console (dev only)
- Provide actionable guidance when possible

3. **Error Logging**
- Log to console in development
- Log to external service in production (e.g., Sentry)
- Include context: user ID, action, timestamp, stack trace

### Error Response Format

```typescript
interface ErrorResponse {
  error: string // User-friendly message
  code?: string // Error code for client handling
  details?: Record<string, any> // Additional context (dev only)
}
```


## Testing Strategy

### Unit Tests

1. **Security Functions**
   - Test HTML sanitization with malicious inputs
   - Test input validators with edge cases
   - Test CSRF token generation and validation
   - Test rate limiter with various scenarios

2. **Auth Functions**
   - Test requireAdmin with different user roles
   - Test session validation and expiry
   - Test checkAdminAuth helper

3. **Auto-Save Manager**
   - Test debouncing behavior
   - Test queue management
   - Test retry logic

### Integration Tests

1. **API Route Security**
   - Test unauthorized access returns 401
   - Test non-admin access returns 403
   - Test CSRF protection on state-changing operations
   - Test rate limiting triggers correctly

2. **Page Rendering**
   - Test server components require authentication
   - Test client components handle auth errors
   - Test redirects work correctly

3. **Audit Logging**
   - Test all CRUD operations create audit logs
   - Test audit logs contain correct data
   - Test audit log queries work

### Security Tests

1. **XSS Prevention**
   - Test malicious HTML is sanitized
   - Test script tags are removed
   - Test event handlers are removed

2. **CSRF Prevention**
   - Test requests without tokens are rejected
   - Test invalid tokens are rejected
   - Test expired tokens are rejected

3. **Authorization**
   - Test non-admin users cannot access admin routes
   - Test banned users are redirected
   - Test unauthenticated users are redirected to sign-in


## Implementation Phases

### Phase 1: Critical Security Fixes (P0)

**Goal**: Address immediate security vulnerabilities

1. Convert client-side admin pages to server components
2. Implement HTML sanitization for CMS content
3. Add server-side input validation
4. Fix CSRF vulnerabilities in delete operations
5. Ensure public pages only show published content

**Success Criteria**: All P0 requirements met, security audit passes

### Phase 2: Authorization & Logging (P1)

**Goal**: Strengthen authorization and add observability

1. Implement consistent auth checks across all API routes
2. Add audit logging for all admin actions
3. Implement rate limiting on admin operations
4. Enhance session management

**Success Criteria**: All P1 requirements met, audit logs functional

### Phase 3: Robustness & UX (P1)

**Goal**: Improve reliability and user experience

1. Fix auto-save race conditions
2. Improve error handling and user feedback
3. Fix middleware subdomain logic

**Success Criteria**: Auto-save reliable, errors clear, subdomain routing works

## Dependencies

### External Libraries

1. **isomorphic-dompurify** - HTML sanitization
2. **@upstash/redis** (optional) - Distributed rate limiting
3. **zod** - Schema validation
4. **nanoid** - CSRF token generation

### Environment Variables

```env
# Required
SUPABASE_SERVICE_ROLE_KEY=xxx
NEXT_PUBLIC_SUPABASE_URL=xxx
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx

# Optional (for Redis-based rate limiting)
UPSTASH_REDIS_REST_URL=xxx
UPSTASH_REDIS_REST_TOKEN=xxx
```


## Security Considerations

### Defense in Depth

1. **Layer 1: Middleware**
   - Rate limiting by IP
   - Session validation
   - Subdomain enforcement

2. **Layer 2: Server Components**
   - requireAdmin() checks
   - Redirect unauthenticated users

3. **Layer 3: API Routes**
   - checkAdminAuth() verification
   - Input validation
   - CSRF protection
   - Audit logging

4. **Layer 4: Database**
   - RLS policies
   - Admin client only after auth
   - Prepared statements (SQL injection prevention)

### Threat Model

**Threats Addressed:**
- Unauthorized access to admin panel
- CSRF attacks on state-changing operations
- XSS attacks via CMS content
- SQL injection via input fields
- Brute force attacks on admin operations
- Session hijacking
- Privilege escalation

**Residual Risks:**
- DDoS attacks (mitigated by rate limiting, but not fully prevented)
- Zero-day vulnerabilities in dependencies
- Social engineering attacks on admin users

### Compliance Considerations

- GDPR: Audit logs contain user data, ensure proper retention policies
- Data minimization: Only log necessary information
- Right to erasure: Implement audit log anonymization for deleted users


## Migration Strategy

### Database Migrations

1. **Create audit_logs table**
   - Run migration to create table and indexes
   - No data migration needed (new table)

2. **Add draft_content_json column**
   - Already exists, verify in production
   - No data migration needed

3. **Create csrf_tokens table** (if not using Redis)
   - Run migration to create table and indexes
   - No data migration needed (new table)

### Code Migration

1. **Convert pages to server components**
   - Update src/app/admin/cms/pages/page.tsx
   - Update src/app/admin/cms/settings/page.tsx
   - Test thoroughly before deployment

2. **Update API routes**
   - Add checkAdminAuth() to all routes
   - Add input validation
   - Add audit logging
   - Deploy incrementally

3. **Add security middleware**
   - Implement rate limiting
   - Add CSRF protection
   - Test in staging environment

### Rollback Plan

- Keep old code in git history
- Feature flags for new security features
- Ability to disable rate limiting if issues arise
- Database migrations are additive (no data loss)

