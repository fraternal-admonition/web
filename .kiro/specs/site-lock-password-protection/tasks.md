# Implementation Plan

- [x] 1. Install dependencies and create password hashing service



  - Add `bcryptjs` and `@types/bcryptjs` to package.json
  - Create `src/lib/security/password-hash.ts` with hashPassword() and verifyPassword() functions
  - Use bcrypt with 12 salt rounds for secure hashing
  - Add password length validation (minimum 8 characters)
  - Add error handling for hashing failures
  - _Requirements: 1.4, 1.8, 8.2_

- [x] 2. Create session management service



  - Create `src/lib/security/site-lock-session.ts` with session management functions
  - Implement createPasswordSession() to generate secure random tokens
  - Implement validatePasswordSession() to check token validity and password hash match
  - Implement invalidateAllPasswordSessions() to clear all sessions
  - Implement deletePasswordSession() to remove current session
  - Use in-memory Map for session storage (single instance)
  - Set secure cookie with httpOnly, secure, sameSite=lax, 7-day expiration
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 8.5_

- [x] 3. Update settings schema with new site lock fields



  - Update `src/lib/cms/settings-schema.ts` to replace site_lock_enabled with site_lock_mode
  - Add site_lock_mode setting with type 'select' and options: 'off', 'auth', 'password'
  - Add site_lock_password_hash setting with type 'password' (hidden from client)
  - Add conditional display logic (password field only shown when mode = 'password')
  - Update CachedSettings interface in settings-cache.ts to include new fields
  - Update getDefaults() to include site_lock_mode: 'off' and site_lock_password_hash: ''
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [x] 4. Create password verification API route



  - Create `src/app/api/site-lock/verify/route.ts` with POST handler
  - Implement rate limiting (5 attempts per 15 minutes per IP)
  - Validate password input (required, non-empty)
  - Fetch settings and verify site_lock_mode is 'password'
  - Verify password against site_lock_password_hash using verifyPassword()
  - Return 401 with generic error message on incorrect password
  - Create session cookie on successful verification using createPasswordSession()
  - Return success response with redirect URL
  - Add error handling for server errors
  - _Requirements: 3.6, 3.7, 3.8, 8.1, 8.3, 8.4_

- [x] 5. Create password prompt page



  - Create `src/app/site-lock/page.tsx` as client component
  - Add branded UI with site logo and "Password Protected" heading
  - Add password input field with proper labels and accessibility
  - Add "Access Site" submit button
  - Implement form submission to /api/site-lock/verify
  - Handle success response by redirecting to original page
  - Handle error response by showing error message and clearing password field
  - Add loading state during verification
  - Preserve redirect parameter from URL
  - Style consistently with site design (#F9F9F7 background, #004D40 primary)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9_

- [x] 6. Update middleware for password mode enforcement



  - Update `middleware.ts` to import validatePasswordSession
  - Add isSiteLockPage check to skip middleware for /site-lock path
  - After maintenance mode check, add site lock mode checks
  - If site_lock_mode is 'auth' and user not authenticated, redirect to /auth/signin
  - If site_lock_mode is 'password', call validatePasswordSession()
  - If no valid password session, redirect to /site-lock with redirect parameter
  - Ensure admin users bypass all site lock modes
  - Add error handling to fail open on settings errors
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

- [x] 7. Create custom site lock control component for admin UI



  - Create `src/components/admin/settings/SiteLockControl.tsx` as client component
  - Add radio button group for mode selection (Off, Require Authentication, Require Password)
  - Add descriptive labels and help text for each mode
  - Show password input fields conditionally when "Require Password" is selected
  - Add password and confirm password fields with validation
  - Validate password length (minimum 8 characters)
  - Validate passwords match before saving
  - Hash password client-side before sending to API (using hashPassword)
  - Add warning message about sharing password securely
  - Add save button that appears when changes are made
  - Add error display for validation and API errors
  - _Requirements: 1.1, 1.2, 1.3, 1.6, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_

- [x] 8. Update settings API to handle password hashing and session invalidation



  - Update `src/app/api/admin/cms/settings/route.ts` PUT handler
  - Add special handling for site_lock_password_hash key
  - Validate password is at least 8 characters
  - Hash password using hashPassword() before storing
  - Save hashed password to database
  - Call invalidateAllPasswordSessions() after password change
  - Add special handling for site_lock_mode changes
  - Invalidate sessions when switching away from password mode
  - Invalidate settings cache after updates
  - _Requirements: 1.5, 4.5, 4.6, 6.6_

- [x] 9. Update admin banner to show password lock status


  - Update `src/components/admin/AdminBanner.tsx` to accept siteLockMode prop
  - Change prop from siteLockEnabled (boolean) to siteLockMode (string)
  - Show "🔒 Site Lock Active - Authentication required" when mode is 'auth'
  - Show "🔒 Password Lock Active - Password required" when mode is 'password'
  - Maintain maintenance mode precedence
  - Update all usages in layout.tsx and admin/layout.tsx to pass siteLockMode
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 10. Create and run migration script for existing site_lock_enabled setting



  - Create `src/lib/cms/migrate-site-lock.ts` with migration function
  - Check if site_lock_enabled setting exists in database
  - Convert true → 'auth', false → 'off'
  - Create site_lock_mode setting with converted value
  - Optionally delete old site_lock_enabled setting
  - Add logging for migration results
  - Create admin API endpoint or script to trigger migration
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

- [x] 11. Update settings page to use custom site lock control



  - Update `src/app/admin/settings/page.tsx` to detect site_lock_mode setting
  - Render SiteLockControl component instead of default SettingControl for site lock
  - Pass current mode value to SiteLockControl
  - Implement save handler that updates both site_lock_mode and site_lock_password_hash
  - Handle password hashing in save handler
  - Show success/error messages after save
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_

- [ ]* 12. Write unit tests for password hashing
  - Write test: hashPassword() produces different hashes for same password
  - Write test: verifyPassword() succeeds with correct password
  - Write test: verifyPassword() fails with incorrect password
  - Write test: hashPassword() validates minimum length
  - Write test: verifyPassword() handles bcrypt errors gracefully
  - _Requirements: 12.1_

- [ ]* 13. Write unit tests for session management
  - Write test: createPasswordSession() generates unique tokens
  - Write test: validatePasswordSession() succeeds with valid token
  - Write test: validatePasswordSession() fails with invalid token
  - Write test: validatePasswordSession() fails when password hash changes
  - Write test: validatePasswordSession() fails after 7 days
  - Write test: invalidateAllPasswordSessions() clears all sessions
  - _Requirements: 12.4, 12.5_

- [ ]* 14. Write integration tests for password verification API
  - Write test: Correct password returns success and sets cookie
  - Write test: Incorrect password returns 401
  - Write test: Missing password returns 400
  - Write test: Rate limiting blocks after 5 attempts
  - Write test: Rate limiting resets after 15 minutes
  - _Requirements: 12.2, 12.3, 12.7_

- [ ]* 15. Write integration tests for middleware protection
  - Write test: Password mode redirects to /site-lock without session
  - Write test: Password mode allows access with valid session
  - Write test: Admin bypasses password protection
  - Write test: Auth mode redirects to /auth/signin
  - Write test: Off mode allows public access
  - Write test: Maintenance mode takes precedence over site lock
  - _Requirements: 12.6_
