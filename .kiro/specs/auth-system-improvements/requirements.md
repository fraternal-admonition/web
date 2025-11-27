# Requirements Document

## Introduction

This document outlines the requirements for improving the authentication system in the Fraternal Admonition application. The current auth system has several issues including lack of automatic session expiration, potential race conditions in profile fetching, inconsistent error handling, and missing visual feedback states. This feature aims to address these issues and enhance the overall security, reliability, and user experience of the authentication system.

## Requirements

### Requirement 1: Automatic Session Management

**User Story:** As a user, I want my session to automatically expire after a period of inactivity, so that my account remains secure when I'm away from my device.

#### Acceptance Criteria

1. WHEN a user's session has been inactive for 24 hours THEN the system SHALL automatically sign out the user
2. WHEN a user's session is about to expire (5 minutes before) THEN the system SHALL display a warning notification
3. WHEN a user interacts with the application THEN the system SHALL reset the inactivity timer
4. WHEN a user's session expires THEN the system SHALL redirect them to the signin page with an appropriate message
5. WHEN a user's refresh token expires THEN the system SHALL handle the error gracefully and prompt re-authentication
6. WHEN checking session validity THEN the system SHALL use auth.sessions table to verify not_after timestamp

### Requirement 2: Profile Fetching Reliability

**User Story:** As a developer, I want the profile fetching logic to be more reliable and handle edge cases properly, so that users don't experience loading states or authentication failures.

#### Acceptance Criteria

1. WHEN a user signs in THEN the system SHALL fetch their profile from public.users table with proper error handling and retry logic
2. IF profile fetching fails after retries THEN the system SHALL display a clear error message to the user
3. WHEN a profile doesn't exist for an authenticated user THEN the system SHALL create one automatically with default role='USER' and is_banned=false
4. WHEN multiple profile fetch requests occur simultaneously THEN the system SHALL deduplicate requests to prevent race conditions
5. IF a profile fetch times out THEN the system SHALL retry with exponential backoff up to 3 times
6. WHEN fetching profile THEN the system SHALL query public.users table using the auth.users.id as foreign key

### Requirement 3: Enhanced Error Handling and User Feedback

**User Story:** As a user, I want to see clear error messages and loading states during authentication operations, so that I understand what's happening and can take appropriate action.

#### Acceptance Criteria

1. WHEN an authentication error occurs THEN the system SHALL display a user-friendly error message
2. WHEN a user is signing in or signing out THEN the system SHALL display appropriate loading indicators
3. WHEN a network error occurs during authentication THEN the system SHALL provide retry options
4. WHEN a user's account is banned THEN the system SHALL immediately sign them out and show the banned page
5. WHEN email verification is required THEN the system SHALL clearly communicate this requirement with a resend option

### Requirement 4: Session Persistence and Recovery

**User Story:** As a user, I want my session to persist across browser refreshes and tabs, so that I don't have to sign in repeatedly.

#### Acceptance Criteria

1. WHEN a user refreshes the page THEN the system SHALL restore their session without requiring re-authentication
2. WHEN a user opens the application in a new tab THEN the system SHALL recognize their existing session
3. WHEN a user's session is restored THEN the system SHALL verify the session is still valid
4. IF a restored session is invalid THEN the system SHALL clear it and redirect to signin
5. WHEN a user signs out in one tab THEN the system SHALL sign them out in all tabs

### Requirement 5: Admin Authentication Flow

**User Story:** As an admin, I want to be automatically redirected to the admin dashboard after signing in, so that I can quickly access admin features.

#### Acceptance Criteria

1. WHEN an admin user signs in THEN the system SHALL redirect them to /admin
2. WHEN a non-admin user tries to access /admin routes THEN the system SHALL redirect them to /dashboard
3. WHEN an admin's role is revoked (role changed from 'ADMIN' to 'USER' or 'TESTER' in public.users) THEN the system SHALL immediately restrict their access to admin routes
4. WHEN an admin session expires THEN the system SHALL redirect them to signin with a redirect parameter to return to /admin
5. IF an admin is banned (is_banned=true in public.users) THEN the system SHALL treat them the same as regular banned users
6. WHEN checking admin status THEN the system SHALL verify role='ADMIN' in public.users table

### Requirement 6: Loading State Management

**User Story:** As a user, I want to see appropriate loading states during authentication operations, so that I know the application is working and not frozen.

#### Acceptance Criteria

1. WHEN the AuthContext is initializing THEN the system SHALL set loading to true
2. WHEN authentication state is determined THEN the system SHALL set loading to false
3. WHEN a user is signing in THEN the signin button SHALL show a loading state and be disabled
4. WHEN a user is signing out THEN the signout button SHALL show a loading state and be disabled
5. WHEN profile data is being fetched THEN the system SHALL show a loading indicator in the navbar

### Requirement 7: OAuth Flow Improvements

**User Story:** As a user signing in with Google, I want the OAuth flow to handle edge cases properly, so that I can reliably authenticate using my Google account.

#### Acceptance Criteria

1. WHEN a user signs in with Google THEN the system SHALL create a profile if one doesn't exist
2. WHEN OAuth callback fails THEN the system SHALL redirect to an error page with a clear message
3. WHEN a user cancels OAuth flow THEN the system SHALL handle it gracefully without errors
4. WHEN an OAuth user's email is not verified by Google THEN the system SHALL still allow signin
5. WHEN an OAuth user is banned THEN the system SHALL prevent signin and show the banned page

### Requirement 8: Sign Out Reliability

**User Story:** As a user, I want the sign out process to be reliable and complete, so that my session is fully terminated when I log out.

#### Acceptance Criteria

1. WHEN a user clicks sign out THEN the system SHALL clear all authentication state
2. WHEN sign out completes THEN the system SHALL clear all Supabase cookies
3. IF sign out API call fails THEN the system SHALL still clear local state and cookies
4. WHEN a user signs out THEN the system SHALL redirect them to the home page
5. WHEN sign out completes THEN the system SHALL trigger a router refresh to update all components

### Requirement 9: Middleware Session Validation

**User Story:** As a system administrator, I want the middleware to validate sessions on every request, so that banned users and invalid sessions are caught immediately.

#### Acceptance Criteria

1. WHEN a request is made THEN the middleware SHALL validate the user's session using auth.sessions table
2. WHEN a banned user makes a request THEN the middleware SHALL check is_banned field in public.users and sign them out, redirecting to /auth/banned
3. WHEN a session is invalid THEN the middleware SHALL allow the request to proceed without authentication
4. WHEN session validation fails THEN the middleware SHALL log the error for debugging
5. WHEN middleware updates session cookies THEN the system SHALL ensure they are properly set in the response
6. WHEN checking ban status THEN the middleware SHALL use service role to bypass RLS and query public.users.is_banned

### Requirement 10: Protected Route Access Control

**User Story:** As a developer, I want protected routes to properly check authentication and authorization, so that unauthorized users cannot access restricted content.

#### Acceptance Criteria

1. WHEN an unauthenticated user accesses /dashboard THEN the system SHALL redirect them to /auth/signin
2. WHEN an unauthenticated user accesses /admin THEN the system SHALL redirect them to /auth/signin with redirect parameter
3. WHEN a non-admin user accesses /admin THEN the system SHALL redirect them to /dashboard
4. WHEN a banned user tries to access protected routes THEN the system SHALL redirect them to /auth/banned
5. WHEN requireAdmin() is called THEN the system SHALL verify both authentication and admin role

### Requirement 11: Visual Feedback in Navbar

**User Story:** As a user, I want the navbar to accurately reflect my authentication state, so that I can see my login status and access appropriate actions.

#### Acceptance Criteria

1. WHEN a user is authenticated THEN the navbar SHALL display their email and role badge
2. WHEN a user is not authenticated THEN the navbar SHALL display Sign In and Sign Up buttons
3. WHEN authentication state is loading THEN the navbar SHALL display a loading indicator
4. WHEN a user is an admin THEN the navbar SHALL display an ADMIN badge
5. WHEN a user clicks Dashboard in the navbar THEN the system SHALL route them based on their role

### Requirement 12: Race Condition Prevention

**User Story:** As a developer, I want to prevent race conditions in authentication state updates, so that the UI remains consistent and doesn't show conflicting states.

#### Acceptance Criteria

1. WHEN multiple auth state changes occur rapidly THEN the system SHALL process them in order
2. WHEN profile fetching is in progress THEN the system SHALL not trigger duplicate fetch requests
3. WHEN sign out is in progress THEN the system SHALL prevent other auth operations
4. WHEN session is being restored THEN the system SHALL block navigation until complete
5. IF auth state changes during navigation THEN the system SHALL cancel outdated navigation attempts

### Requirement 13: Session Activity Tracking

**User Story:** As a security-conscious user, I want the system to track my session activity, so that I can see when and where I've logged in.

#### Acceptance Criteria

1. WHEN a user signs in THEN the system SHALL record last_sign_in_at in auth.users table
2. WHEN a session is created THEN the system SHALL store user_agent and ip in auth.sessions table
3. WHEN a session is refreshed THEN the system SHALL update refreshed_at timestamp in auth.sessions
4. WHEN checking session validity THEN the system SHALL verify the session exists in auth.sessions and is not expired
5. WHEN a user has multiple active sessions THEN the system SHALL track each session separately in auth.sessions
