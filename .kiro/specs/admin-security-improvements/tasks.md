# Implementation Plan

- [x] 1. Set up security infrastructure and database schema


  - Create audit_logs table with proper indexes
  - Create csrf_tokens table (if not using Redis)
  - Create rate_limits table (if not using Redis)
  - Install required dependencies (isomorphic-dompurify, zod, nanoid)
  - _Requirements: 1.1, 6.1, 6.2, 6.3_

- [x] 2. Implement core security utilities


- [x] 2.1 Create HTML sanitization utility


  - Implement sanitizeHTML function using isomorphic-dompurify
  - Configure allowed tags and attributes for CMS content
  - Add unit tests for XSS prevention
  - _Requirements: 3.1, 3.2_

- [x] 2.2 Create input validation utilities


  - Implement validateSlug function with server-side regex
  - Implement validateJSON function for settings
  - Implement validateURL function for asset paths
  - Add Zod schemas for all input types
  - _Requirements: 3.2, 3.3, 3.4_

- [x] 2.3 Create CSRF protection system


  - Implement generateCSRFToken function
  - Implement validateCSRFToken function
  - Add CSRF token storage (Redis or database)
  - Create middleware for CSRF validation
  - _Requirements: 2.1, 2.2, 2.3, 2.4_


- [x] 3. Implement authentication and authorization enhancements


- [x] 3.1 Create checkAdminAuth helper for API routes


  - Implement reusable auth check function
  - Return structured result with user data or error
  - Add logging for failed auth attempts
  - _Requirements: 1.1, 1.2, 1.5_

- [x] 3.2 Enhance requireAdmin function

  - Add session validity checks
  - Add logging for access attempts
  - Improve error handling and redirects
  - _Requirements: 1.3, 1.5_

- [x] 3.3 Implement session management utilities


  - Create validateAdminSession function
  - Create extendSession function for activity tracking
  - Create invalidateSession function for sign-out
  - Implement 30-minute inactivity timeout
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 4. Implement rate limiting system


- [x] 4.1 Create RateLimiter class


  - Implement sliding window algorithm
  - Add Redis integration (with fallback to in-memory)
  - Configure limits: 100 req/min per user, 1000 req/hour per IP
  - _Requirements: 5.1, 5.2_

- [x] 4.2 Add rate limiting to middleware


  - Integrate RateLimiter into Next.js middleware
  - Track requests by user ID and IP address
  - Return 429 responses when limit exceeded
  - _Requirements: 5.2, 5.3_

- [x] 4.3 Add rate limit cooldown and logging

  - Implement cooldown period after rate limit
  - Log rate limit violations with user ID and IP
  - _Requirements: 5.3, 5.4_


- [x] 5. Implement audit logging system


- [x] 5.1 Create audit logging utility


  - Implement logAuditEvent function
  - Define AuditEvent interface
  - Add database insertion logic
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 5.2 Add audit logging to CMS pages API routes



  - Log CREATE operations in POST /api/admin/cms/pages
  - Log UPDATE operations in PUT /api/admin/cms/pages/[id]
  - Log DELETE operations in DELETE /api/admin/cms/pages/[id]
  - Include changed data in audit logs
  - _Requirements: 6.1_

- [x] 5.3 Add audit logging to CMS settings API routes


  - Log CREATE operations in POST /api/admin/cms/settings
  - Log UPDATE operations in PUT /api/admin/cms/settings/[id]
  - Log DELETE operations in DELETE /api/admin/cms/settings/[id]
  - Include changed data in audit logs
  - _Requirements: 6.2_

- [x] 5.4 Add audit logging to CMS assets API routes


  - Log CREATE operations in POST /api/admin/cms/assets
  - Log DELETE operations in DELETE /api/admin/cms/assets/[id]
  - Include asset details in audit logs
  - _Requirements: 6.3_

- [x] 5.5 Implement audit log retention and querying

  - Add query functions for filtering by user, action, date
  - Implement 90-day retention policy
  - _Requirements: 6.4, 6.5_


- [x] 6. Fix critical security vulnerabilities in admin pages


- [x] 6.1 Convert CMS pages list to server component


  - Change src/app/admin/cms/pages/page.tsx to server component
  - Add requireAdmin() check at component level
  - Move data fetching to server side
  - Update UI to work with server rendering
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 6.2 Convert CMS settings page to server component


  - Change src/app/admin/cms/settings/page.tsx to server component
  - Add requireAdmin() check at component level
  - Move data fetching to server side
  - Update UI to work with server rendering
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 6.3 Fix CSRF vulnerabilities in delete operations

  - Replace POST with hidden _method field with proper DELETE requests
  - Add CSRF token validation to all state-changing operations
  - Update asset delete button to use DELETE method
  - Update page delete button to use DELETE method
  - Update setting delete button to use DELETE method
  - _Requirements: 2.1, 2.2, 2.4_

- [x] 6.4 Add HTML sanitization to CMS content

  - Sanitize content in POST /api/admin/cms/pages
  - Sanitize content in PUT /api/admin/cms/pages/[id]
  - Sanitize content in POST /api/admin/cms/pages/[id]/draft
  - Add validation error responses for rejected content
  - _Requirements: 3.1, 3.5_

- [x] 6.5 Add input validation to all API routes

  - Validate slug format in pages routes
  - Validate JSON structure in settings routes
  - Validate URL format in assets routes
  - Return specific validation error messages
  - _Requirements: 3.2, 3.3, 3.4, 3.5_


- [x] 7. Secure all admin API routes with consistent authorization

- [x] 7.1 Update pages API routes with checkAdminAuth

  - Add checkAdminAuth to GET /api/admin/cms/pages
  - Add checkAdminAuth to POST /api/admin/cms/pages
  - Add checkAdminAuth to GET /api/admin/cms/pages/[id]
  - Add checkAdminAuth to PUT /api/admin/cms/pages/[id]
  - Add checkAdminAuth to DELETE /api/admin/cms/pages/[id]
  - Add checkAdminAuth to POST /api/admin/cms/pages/[id]/draft
  - _Requirements: 1.1, 1.2, 1.4_

- [x] 7.2 Update settings API routes with checkAdminAuth

  - Add checkAdminAuth to GET /api/admin/cms/settings
  - Add checkAdminAuth to POST /api/admin/cms/settings
  - Add checkAdminAuth to PUT /api/admin/cms/settings/[id]
  - Add checkAdminAuth to DELETE /api/admin/cms/settings/[id]
  - _Requirements: 1.1, 1.2, 1.4_

- [x] 7.3 Update assets API routes with checkAdminAuth

  - Add checkAdminAuth to GET /api/admin/cms/assets
  - Add checkAdminAuth to POST /api/admin/cms/assets
  - Add checkAdminAuth to DELETE /api/admin/cms/assets/[id]
  - _Requirements: 1.1, 1.2, 1.4_

- [x] 8. Fix public page access security

- [x] 8.1 Ensure public API only returns published pages

  - Verify GET /api/cms/pages/[slug] filters by published=true
  - Add test to ensure unpublished pages return 404
  - _Requirements: 11.1, 11.2_

- [x] 8.2 Ensure public page component uses published content

  - Verify src/app/[slug]/page.tsx uses content_rich_json not draft_content_json
  - Add safeguards against draft content exposure
  - _Requirements: 11.3_

- [x] 8.3 Add RLS policies for CMS tables

  - Create RLS policy to prevent direct access to unpublished pages
  - Create RLS policy to prevent exposure of draft content
  - Create RLS policy to prevent exposure of admin-only metadata
  - _Requirements: 11.4, 11.5_


- [x] 9. Implement auto-save improvements




- [x] 9.1 Create AutoSaveManager class




  - Implement debouncing with 30-second delay
  - Add save queue for concurrent requests
  - Add retry logic with exponential backoff
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 9.2 Integrate AutoSaveManager into page editor




  - Update src/app/admin/cms/pages/[id]/page.tsx
  - Cancel auto-save on manual save
  - Attempt save on navigation away
  - _Requirements: 7.4, 7.5_

- [x] 9.3 Integrate AutoSaveManager into new page form



  - Update src/app/admin/cms/pages/new/page.tsx
  - Use AutoSaveManager instead of direct localStorage
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 10. Implement error handling improvements




- [x] 10.1 Create AdminError class and error handler




  - Define AdminError with code, statusCode, userMessage
  - Implement handleAPIError function
  - Implement formatUserError function
  - _Requirements: 8.1, 8.5_

- [x] 10.2 Update API routes with improved error handling



  - Replace generic error messages with specific ones
  - Add error logging with context
  - Return structured error responses
  - _Requirements: 8.1, 8.5_

- [x] 10.3 Update client components with better error display



  - Highlight specific fields with validation errors
  - Show network error indicators
  - Display success messages with details
  - _Requirements: 8.2, 8.3, 8.4_


- [x] 11. Fix middleware subdomain logic

- [x] 11.1 Improve subdomain detection




  - Add fallback for missing hostname
  - Add better localhost detection
  - Add environment-based configuration
  - _Requirements: 9.4_

- [x] 11.2 Test subdomain routing in production

  - Verify admin.domain.com serves admin routes
  - Verify domain.com/admin redirects to home
  - Verify API routes work on both domains
  - _Requirements: 9.1, 9.2, 9.5_

- [x] 11.3 Test subdomain routing in development

  - Verify localhost/admin allows direct access
  - Verify API routes work in development
  - _Requirements: 9.3, 9.5_

- [ ] 12. Add comprehensive testing
- [ ] 12.1 Write unit tests for security utilities


  - Test HTML sanitization with malicious inputs
  - Test input validators with edge cases
  - Test CSRF token generation and validation
  - Test rate limiter with various scenarios
  - _Requirements: All security requirements_

- [ ] 12.2 Write integration tests for API routes
  - Test unauthorized access returns 401
  - Test non-admin access returns 403
  - Test CSRF protection works
  - Test rate limiting triggers correctly
  - Test audit logs are created
  - _Requirements: 1.1, 1.2, 2.4, 5.2, 6.1, 6.2, 6.3_

- [ ] 12.3 Write security tests
  - Test XSS prevention in CMS content
  - Test CSRF prevention on all state-changing operations
  - Test authorization on all admin routes
  - _Requirements: 3.1, 2.4, 1.1, 1.2_

