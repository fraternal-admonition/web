# Implementation Plan

- [x] 1. Set up core infrastructure and utilities



  - Create utility functions for retry logic with exponential backoff
  - Create error classification utilities (retryable vs non-retryable)
  - Create structured logging helpers for auth operations
  - _Requirements: 3.1, 3.3_

- [x] 2. Implement ProfileCache class



  - [x] 2.1 Create ProfileCache class with Map-based caching


    - Implement getProfile method with cache lookup
    - Implement request deduplication using pending requests map
    - Add cache invalidation methods (invalidate, clear)
    - Set TTL to 5 minutes for cached profiles
    - _Requirements: 2.4, 12.2_

  - [ ]* 2.2 Write unit tests for ProfileCache
    - Test cache hit/miss scenarios
    - Test request deduplication
    - Test cache invalidation
    - Test TTL expiration
    - _Requirements: 2.4_

- [x] 3. Implement ActivityTracker class



  - [x] 3.1 Create ActivityTracker class with event listeners


    - Track mouse, keyboard, and navigation events
    - Implement throttling (max once per minute)
    - Store last activity in localStorage
    - Implement cross-tab sync using BroadcastChannel
    - _Requirements: 1.3, 12.1_

  - [ ]* 3.2 Write unit tests for ActivityTracker
    - Test activity recording
    - Test inactivity detection (24-hour threshold)
    - Test event throttling
    - Test cross-tab synchronization
    - _Requirements: 1.3_

- [x] 4. Implement SessionManager class



  - [x] 4.1 Create SessionManager class with timer management


    - Implement startMonitoring to set up expiry and warning timers
    - Implement stopMonitoring to clear timers
    - Implement recordActivity to reset inactivity timer
    - Check auth.sessions.not_after for expiration
    - Set warning timer for 5 minutes before expiry
    - _Requirements: 1.1, 1.2, 1.6_

  - [x] 4.2 Implement session refresh logic


    - Create refreshSession method using Supabase client
    - Handle refresh token expiration gracefully
    - Update session state after successful refresh
    - _Requirements: 1.5, 8.5_

  - [ ]* 4.3 Write unit tests for SessionManager
    - Test timer setup and cleanup
    - Test expiry warning notifications
    - Test session refresh
    - Test activity recording integration
    - _Requirements: 1.1, 1.2_

- [x] 5. Implement Auth State Machine



  - [x] 5.1 Create StateMachine class with state transitions


    - Define AuthState enum (INITIALIZING, AUTHENTICATED, etc.)
    - Implement transition method with validation
    - Implement canTransition to check valid transitions
    - Add state change subscription mechanism
    - _Requirements: 12.1, 12.4_

  - [ ]* 5.2 Write unit tests for StateMachine
    - Test valid state transitions
    - Test invalid transition prevention
    - Test state change notifications
    - _Requirements: 12.1_

- [x] 6. Enhance AuthContext with new components



  - [x] 6.1 Integrate SessionManager into AuthContext

    - Initialize SessionManager in AuthProvider
    - Connect session expiry callback to sign out
    - Connect warning callback to toast notification
    - Start monitoring on successful sign in
    - Stop monitoring on sign out
    - _Requirements: 1.1, 1.2, 1.4_

  - [x] 6.2 Integrate ProfileCache into AuthContext

    - Initialize ProfileCache in AuthProvider
    - Replace direct profile fetches with cache.getProfile
    - Invalidate cache on profile updates
    - Clear cache on sign out
    - _Requirements: 2.1, 2.4_

  - [x] 6.3 Integrate ActivityTracker into AuthContext

    - Initialize ActivityTracker in AuthProvider
    - Start tracking on sign in
    - Stop tracking on sign out
    - Connect activity events to SessionManager
    - _Requirements: 1.3_

  - [x] 6.4 Integrate StateMachine into AuthContext

    - Initialize StateMachine in AuthProvider
    - Update state on auth events (sign in, sign out, error)
    - Use state to control loading and error display
    - Prevent invalid state transitions
    - _Requirements: 12.1, 12.4, 12.5_

  - [x] 6.5 Add error state management to AuthContext

    - Add error state with AuthError type
    - Add clearError method
    - Classify errors as retryable or non-retryable
    - Expose error state to consumers
    - _Requirements: 3.1, 3.3_

  - [x] 6.6 Add session info to AuthContext

    - Add sessionExpiry state
    - Add lastActivity state
    - Add refreshSession method
    - Expose session info to consumers
    - _Requirements: 1.2, 1.3, 13.3_

  - [ ]* 6.7 Write integration tests for enhanced AuthContext
    - Test sign in flow with all components
    - Test sign out flow with cleanup
    - Test session expiry handling
    - Test profile caching
    - Test error handling
    - _Requirements: 1.1, 2.1, 3.1_

- [x] 7. Enhance middleware with caching


  - [x] 7.1 Implement user status cache in middleware


    - Create Map-based cache for user ban status and role
    - Set cache TTL to 1 minute
    - Check cache before querying database
    - Update cache after database query
    - _Requirements: 9.2, 9.6_

  - [x] 7.2 Optimize ban status checking

    - Only use service role for ban checks (not every request)
    - Query public.users.is_banned and role in single query
    - Add request ID for debugging
    - Log suspicious activity
    - _Requirements: 9.1, 9.2, 9.4_

  - [x] 7.3 Improve session validation

    - Validate session using auth.sessions table
    - Check not_after timestamp for expiration
    - Handle invalid sessions gracefully
    - Ensure cookies are properly set in response
    - _Requirements: 9.1, 9.3, 9.5_

  - [ ]* 7.4 Write integration tests for middleware
    - Test session validation
    - Test ban status checking
    - Test cache behavior
    - Test redirect logic
    - _Requirements: 9.1, 9.2_

- [x] 8. Enhance requireAdmin helper


  - [x] 8.1 Add redirect parameter support

    - Accept optional redirectTo parameter
    - Build signin URL with redirect query param
    - Preserve original destination after signin
    - _Requirements: 5.4_

  - [x] 8.2 Improve error handling

    - Add detailed error logging
    - Handle missing profile gracefully
    - Return user and userData to avoid duplicate queries
    - _Requirements: 3.1, 10.5_

  - [x] 8.3 Add role and ban status checks

    - Query public.users for role and is_banned
    - Redirect banned users to /auth/banned
    - Redirect non-admins to /dashboard
    - Verify role='ADMIN' from enum
    - _Requirements: 5.1, 5.2, 5.3, 5.5, 5.6_

  - [ ]* 8.4 Write unit tests for requireAdmin
    - Test unauthenticated access
    - Test non-admin access
    - Test banned admin access
    - Test successful admin access
    - _Requirements: 10.2, 10.3, 10.4, 10.5_

- [x] 9. Improve sign out reliability


  - [x] 9.1 Enhance signOut method in AuthContext

    - Add timeout for sign out operation (5 seconds)
    - Clear local state even if API call fails
    - Clear all Supabase cookies manually
    - Trigger router refresh after redirect
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 9.2 Implement cross-tab sign out

    - Broadcast sign out event to other tabs
    - Listen for sign out events from other tabs
    - Synchronize sign out across all tabs
    - _Requirements: 4.5_

  - [ ]* 9.3 Write integration tests for sign out
    - Test successful sign out
    - Test sign out with API failure
    - Test cross-tab sign out
    - Test state cleanup
    - _Requirements: 8.1, 8.2, 8.3_

- [x] 10. Enhance Navbar with loading states



  - [x] 10.1 Add loading indicators



    - Show loading spinner during auth initialization
    - Show loading state during sign out
    - Disable buttons during operations
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 10.2 Improve user info display

    - Show full email on hover (tooltip)
    - Display role badge for admins
    - Show session expiry warning icon when near expiry
    - _Requirements: 11.1, 11.2, 11.4_

  - [x] 10.3 Add error display

    - Show error toast for auth failures
    - Add retry button for retryable errors
    - Clear error on successful retry
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ]* 10.4 Write component tests for Navbar
    - Test loading states
    - Test authenticated state display
    - Test unauthenticated state display
    - Test error display
    - _Requirements: 11.1, 11.2, 11.3_

- [x] 11. Enhance auth pages with better error handling



  - [x] 11.1 Improve signin page




    - Add loading state to signin button
    - Display user-friendly error messages
    - Add retry button for network errors
    - Show email verification reminder
    - _Requirements: 3.1, 3.2, 3.5_

  - [x] 11.2 Improve signup page

    - Add loading state to signup button
    - Display user-friendly error messages
    - Show password strength indicator
    - Improve success message with next steps
    - _Requirements: 3.1, 3.2_

  - [x] 11.3 Improve OAuth flow

    - Handle cancelled OAuth gracefully
    - Show loading state during OAuth redirect
    - Display clear error messages on failure
    - Auto-create profile for OAuth users
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ]* 11.4 Write integration tests for auth pages
    - Test signin flow with errors
    - Test signup flow with errors
    - Test OAuth flow
    - Test error recovery
    - _Requirements: 3.1, 7.1_

- [x] 12. Implement session expiry warning UI


  - [x] 12.1 Create SessionExpiryWarning component

    - Display modal 5 minutes before expiry
    - Show countdown timer
    - Add "Stay signed in" button to refresh session
    - Add "Sign out" button
    - _Requirements: 1.2_

  - [x] 12.2 Integrate warning into layout

    - Add SessionExpiryWarning to root layout
    - Connect to SessionManager warning callback
    - Handle user actions (refresh or sign out)
    - _Requirements: 1.2, 1.4_

  - [x] 12.3 Write component tests for SessionExpiryWarning






    - Test warning display
    - Test countdown timer
    - Test refresh action
    - Test sign out action
    - _Requirements: 1.2_

- [ ] 13. Implement protected route improvements






  - [x] 13.1 Update dashboard page



    - Check authentication using server-side createClient
    - Redirect unauthenticated users to /auth/signin
    - Handle banned users
    - _Requirements: 10.1_

  - [x] 13.2 Update admin pages

    - Use requireAdmin helper consistently
    - Pass redirect parameter for deep links
    - Handle role changes gracefully
    - _Requirements: 10.2, 10.3, 10.5_

  - [ ]* 13.3 Write integration tests for protected routes
    - Test unauthenticated access to /dashboard
    - Test unauthenticated access to /admin
    - Test non-admin access to /admin
    - Test banned user access
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [] 14. Add session activity tracking

  - [] 14.1 Update signin API route

    - Record last_sign_in_at in auth.users
    - Store user_agent and ip in auth.sessions
    - Log signin events for audit
    - _Requirements: 13.1, 13.2_

  - [] 14.2 Implement session refresh tracking

    - Update refreshed_at in auth.sessions on refresh
    - Track refresh attempts
    - Log refresh failures
    - _Requirements: 13.3_

  - [ ]* 14.3 Write integration tests for activity tracking
    - Test last_sign_in_at update
    - Test session data storage
    - Test refresh tracking
    - _Requirements: 13.1, 13.2, 13.3_

- [] 15. Add monitoring and logging

  - [] 15.1 Implement structured logging

    - Create logger utility with log levels
    - Add auth operation logging (signin, signout, refresh)
    - Log errors with context
    - Add request IDs for tracing
    - _Requirements: 9.4_

  - [] 15.2 Add performance monitoring

    - Track auth operation durations
    - Monitor cache hit rates
    - Track error rates by type
    - Log slow operations (> 2s)
    - _Requirements: Performance metrics from design_

  - [ ]* 15.3 Set up error tracking
    - Integrate error tracking service (optional)
    - Track auth errors with context
    - Set up alerts for high error rates
    - _Requirements: 3.1_

- [] 16. Documentation and cleanup


  - [] 16.1 Update code documentation

    - Add JSDoc comments to new classes
    - Document public APIs
    - Add usage examples
    - Update README with auth improvements
    - _Requirements: All_

  - [] 16.2 Remove debug logging

    - Remove or conditionally enable console.log statements
    - Keep error logging
    - Add environment-based logging levels
    - _Requirements: All_

  - [] 16.3 Code cleanup

    - Remove unused code
    - Fix linting issues
    - Optimize imports
    - Format code consistently
    - _Requirements: All_
