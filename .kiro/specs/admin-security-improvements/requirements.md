# Requirements Document

## Introduction

This document outlines the requirements for improving the admin panel security, functionality, and user experience. After analyzing all admin-related pages, backend routes, and the public slug page, several critical security vulnerabilities, functional issues, and UI/UX problems have been identified that need to be addressed to ensure a secure and robust admin system.

## Priority Classification

**P0 (Critical - Must Fix):** Security vulnerabilities that could lead to data breaches or unauthorized access
**P1 (High - Should Fix):** Functional issues that impact core workflows or data integrity
**P2 (Medium - Nice to Have):** UX improvements and optimizations

## Requirements

### Requirement 1: Secure Admin API Routes with Consistent Authorization [P0]

**User Story:** As a system administrator, I want all admin API routes to be properly secured so that unauthorized users cannot access or manipulate admin-only data.

#### Acceptance Criteria

1. WHEN an unauthenticated user attempts to access any admin API route THEN the system SHALL return a 401 Unauthorized response
2. WHEN an authenticated non-admin user attempts to access any admin API route THEN the system SHALL return a 403 Forbidden response
3. WHEN the admin client pages are rendered server-side THEN the system SHALL use requireAdmin() consistently across all admin pages
4. IF an admin API route uses createAdminClient() THEN the system SHALL first verify the user's admin role through the regular client
5. WHEN authorization checks fail THEN the system SHALL log the security event with user ID and attempted action

### Requirement 2: Prevent CSRF Attacks on State-Changing Operations [P0]

**User Story:** As a security engineer, I want all state-changing operations to be protected against CSRF attacks so that malicious sites cannot perform unauthorized actions on behalf of authenticated admins.

#### Acceptance Criteria

1. WHEN a DELETE operation is performed on pages, assets, or settings THEN the system SHALL use proper HTTP DELETE method instead of POST with hidden fields
2. WHEN the sign-out form is submitted THEN the system SHALL include CSRF token validation
3. WHEN any state-changing operation is performed THEN the system SHALL validate the request origin
4. IF a CSRF token is missing or invalid THEN the system SHALL reject the request with a 403 Forbidden response

### Requirement 3: Implement Proper Input Validation and Sanitization [P0]

**User Story:** As a security engineer, I want all user inputs to be properly validated and sanitized so that XSS and injection attacks are prevented.

#### Acceptance Criteria

1. WHEN HTML content is saved in the CMS editor THEN the system SHALL sanitize the HTML to remove malicious scripts
2. WHEN a slug is created or updated THEN the system SHALL validate it matches the pattern [a-z0-9-]+ on the server side
3. WHEN JSON values are saved in settings THEN the system SHALL validate the JSON structure before saving
4. WHEN file URLs are provided for assets THEN the system SHALL validate the URL format and optionally check file existence
5. IF validation fails THEN the system SHALL return specific error messages indicating which field failed validation

### Requirement 4: Fix Client-Side Security Issues [P0]

**User Story:** As a security engineer, I want client-side pages to handle authentication properly so that sensitive operations cannot be bypassed.

#### Acceptance Criteria

1. WHEN admin pages are rendered THEN the system SHALL perform authentication checks server-side, not client-side
2. WHEN the CMS pages list is displayed THEN the system SHALL use server-side rendering with requireAdmin()
3. WHEN the CMS settings page is displayed THEN the system SHALL use server-side rendering with requireAdmin()
4. IF a user attempts to access a client-rendered admin page without authentication THEN the system SHALL redirect before rendering any content

### Requirement 5: Implement Rate Limiting on Admin Operations [P1]

**User Story:** As a system administrator, I want rate limiting on admin operations so that brute force attacks and abuse are prevented.

#### Acceptance Criteria

1. WHEN an admin performs multiple operations within a short time THEN the system SHALL track the request rate per user
2. IF the request rate exceeds 100 requests per minute THEN the system SHALL return a 429 Too Many Requests response
3. WHEN rate limiting is triggered THEN the system SHALL log the event with user ID and IP address
4. WHEN the rate limit cooldown period expires THEN the system SHALL allow requests again

### Requirement 6: Add Audit Logging for Admin Actions [P1]

**User Story:** As a system administrator, I want all admin actions to be logged so that I can track changes and investigate security incidents.

#### Acceptance Criteria

1. WHEN an admin creates, updates, or deletes a CMS page THEN the system SHALL log the action with timestamp, user ID, and changed data
2. WHEN an admin creates, updates, or deletes a setting THEN the system SHALL log the action with timestamp, user ID, and changed data
3. WHEN an admin creates or deletes an asset THEN the system SHALL log the action with timestamp, user ID, and asset details
4. WHEN audit logs are queried THEN the system SHALL support filtering by user, action type, and date range
5. WHEN audit logs are stored THEN the system SHALL retain them for at least 90 days

### Requirement 7: Fix Draft Auto-Save Race Conditions [P1]

**User Story:** As a content editor, I want the auto-save feature to work reliably so that I don't lose my work due to race conditions or conflicts.

#### Acceptance Criteria

1. WHEN multiple auto-save requests are triggered THEN the system SHALL debounce requests to prevent race conditions
2. WHEN an auto-save is in progress THEN the system SHALL queue subsequent save requests
3. WHEN an auto-save fails THEN the system SHALL retry with exponential backoff up to 3 times
4. WHEN a manual save is triggered THEN the system SHALL cancel any pending auto-save operations
5. WHEN the user navigates away THEN the system SHALL attempt to save any unsaved changes

### Requirement 8: Improve Error Handling and User Feedback [P1]

**User Story:** As a content editor, I want clear error messages and feedback so that I understand what went wrong and how to fix it.

#### Acceptance Criteria

1. WHEN a server error occurs THEN the system SHALL display a user-friendly error message instead of generic "Failed to..." messages
2. WHEN a validation error occurs THEN the system SHALL highlight the specific field with the error
3. WHEN a network error occurs THEN the system SHALL indicate the connection issue and suggest retry
4. WHEN an operation succeeds THEN the system SHALL display a success message with relevant details
5. WHEN an error is displayed THEN the system SHALL log the full error details for debugging

### Requirement 9: Fix Middleware Subdomain Logic Issues [P1]

**User Story:** As a system administrator, I want the subdomain routing to work correctly so that admin access is properly controlled in production.

#### Acceptance Criteria

1. WHEN accessing admin.domain.com in production THEN the system SHALL serve admin routes
2. WHEN accessing domain.com/admin in production THEN the system SHALL redirect to the home page
3. WHEN accessing localhost/admin in development THEN the system SHALL allow direct access for testing
4. WHEN the hostname detection fails THEN the system SHALL default to secure behavior (deny admin access)
5. WHEN API routes are accessed THEN the system SHALL work correctly regardless of subdomain

### Requirement 10: Implement Proper Session Management for Admin Routes [P1]

**User Story:** As a system administrator, I want admin sessions to be properly managed so that inactive sessions expire and active sessions remain valid.

#### Acceptance Criteria

1. WHEN an admin is inactive for 30 minutes THEN the system SHALL expire the session
2. WHEN an admin session expires THEN the system SHALL redirect to sign-in with the original URL preserved
3. WHEN an admin performs an action THEN the system SHALL extend the session timeout
4. WHEN an admin signs out THEN the system SHALL invalidate the session immediately
5. WHEN session validation fails THEN the system SHALL clear any stale session data

### Requirement 11: Fix Public Page Access Security [P0]

**User Story:** As a regular user, I want to access published CMS pages securely so that I can view content without exposing unpublished drafts.

#### Acceptance Criteria

1. WHEN I access a page by slug THEN the system SHALL only return published pages
2. WHEN I access an unpublished page THEN the system SHALL return a 404 error
3. WHEN the page content is rendered THEN the system SHALL use the published content_rich_json, not draft_content_json
4. WHEN RLS policies are applied THEN the system SHALL prevent direct database access to unpublished pages
5. WHEN a page is accessed THEN the system SHALL not expose internal IDs or admin-only metadata
