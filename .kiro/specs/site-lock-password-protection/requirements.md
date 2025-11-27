# Requirements Document

## Introduction

The current site lock implementation (`site_lock_enabled`) redirects unauthenticated users to the sign-in page, requiring full user authentication. However, there's a need for a simpler password-based site lock that allows access with a single shared password without requiring individual user accounts. This is useful for scenarios like:
- Private beta testing where you want to share one password with testers
- Development/staging environments that need basic protection
- Client previews where you don't want to create individual accounts
- Temporary access control during site preparation

This feature adds a password-protected site lock option that works alongside the existing authentication-based site lock, giving administrators flexibility in how they control site access.

## Requirements

### Requirement 1: Password-Based Site Lock Configuration

**User Story:** As a site administrator, I want to enable a password-protected site lock with a custom password, so that I can control site access without requiring users to create accounts.

#### Acceptance Criteria

1. WHEN an admin views the site lock setting THEN they SHALL see an option to enable password protection
2. WHEN an admin enables password-protected site lock THEN they SHALL be required to set a password
3. WHEN an admin sets a site lock password THEN the password SHALL be at least 8 characters long
4. WHEN an admin sets a site lock password THEN the password SHALL be hashed before storage (never stored in plain text)
5. WHEN an admin updates the site lock password THEN the new password SHALL replace the old password
6. WHEN an admin disables password-protected site lock THEN the stored password SHALL remain in the database for future use
7. WHEN an admin enables password-protected site lock THEN they SHALL see a warning that this provides basic protection only
8. WHEN the site lock password is stored THEN it SHALL use bcrypt or similar secure hashing algorithm

### Requirement 2: Site Lock Mode Selection

**User Story:** As a site administrator, I want to choose between authentication-based site lock and password-based site lock, so that I can use the appropriate access control for my needs.

#### Acceptance Criteria

1. WHEN an admin enables site lock THEN they SHALL choose between "Require Admin Authentication" or "Require Password"
2. WHEN "Require Admin Authentication" is selected THEN only users with ADMIN role SHALL be able to access the site
3. WHEN "Require Admin Authentication" is selected AND a non-admin user is logged in THEN they SHALL see an access denied page
4. WHEN "Require Password" is selected THEN all users SHALL see a password prompt page
4. WHEN both modes are configured THEN only one mode SHALL be active at a time
5. WHEN switching between modes THEN the change SHALL take effect immediately on next page load
6. WHEN site lock is disabled THEN neither mode SHALL be active
7. WHEN an admin is logged in THEN they SHALL bypass both site lock modes

### Requirement 3: Password Prompt Page

**User Story:** As a visitor, I want to see a clean password prompt page when password-protected site lock is enabled, so that I can enter the password and access the site.

#### Acceptance Criteria

1. WHEN password-protected site lock is enabled THEN unauthenticated visitors SHALL see a password prompt page
2. WHEN the password prompt page loads THEN it SHALL display the site logo and name
3. WHEN the password prompt page loads THEN it SHALL show a clear message: "This site is password protected"
4. WHEN the password prompt page loads THEN it SHALL show a password input field
5. WHEN the password prompt page loads THEN it SHALL show an "Access Site" button
6. WHEN a user enters the correct password THEN they SHALL be granted access to the site
7. WHEN a user enters an incorrect password THEN they SHALL see an error message "Incorrect password"
8. WHEN a user enters an incorrect password THEN the password field SHALL be cleared
9. WHEN the password prompt page is displayed THEN it SHALL be responsive and accessible

### Requirement 4: Password Session Management

**User Story:** As a visitor who entered the correct site lock password, I want my access to persist across page navigations, so that I don't have to re-enter the password on every page.

#### Acceptance Criteria

1. WHEN a user enters the correct password THEN a session cookie SHALL be created
2. WHEN a user has a valid password session THEN they SHALL access all pages without re-entering the password
3. WHEN a user's password session is valid THEN they SHALL NOT see the password prompt page
4. WHEN a user closes their browser THEN the password session SHALL expire
5. WHEN the site lock password is changed THEN existing password sessions SHALL be invalidated
6. WHEN the site lock mode is changed from password to authentication THEN password sessions SHALL be invalidated
7. WHEN a user's session cookie is tampered with THEN they SHALL be prompted for the password again
8. WHEN a password session is created THEN it SHALL be stored securely (httpOnly, secure, sameSite)

### Requirement 5: Middleware Integration

**User Story:** As a developer, I want the password-protected site lock to be enforced at the middleware level, so that it's consistently applied across all routes.

#### Acceptance Criteria

1. WHEN password-protected site lock is enabled THEN middleware SHALL check for valid password session
2. WHEN a user has no password session THEN middleware SHALL redirect to the password prompt page
3. WHEN a user has a valid password session THEN middleware SHALL allow the request to proceed
4. WHEN an admin is logged in THEN middleware SHALL bypass password protection
5. WHEN maintenance mode is active THEN maintenance mode SHALL take precedence over password protection
6. WHEN the password prompt page is accessed THEN middleware SHALL NOT redirect (to avoid infinite loop)
7. WHEN auth routes are accessed THEN middleware SHALL NOT apply password protection
8. WHEN API routes are accessed THEN middleware SHALL apply password protection based on session

### Requirement 6: Database Schema Updates

**User Story:** As a developer, I want the site lock configuration stored properly in the database, so that settings persist and can be managed through the admin interface.

#### Acceptance Criteria

1. WHEN the system stores site lock settings THEN it SHALL use the existing cms_settings table
2. WHEN storing site lock mode THEN it SHALL use a new setting key `site_lock_mode` with values: "off", "auth", or "password"
3. WHEN storing the site lock password THEN it SHALL use a new setting key `site_lock_password_hash`
4. WHEN the password hash is stored THEN it SHALL never be exposed to the client
5. WHEN the settings schema is updated THEN it SHALL include the new site lock settings
6. WHEN the settings cache is updated THEN it SHALL include the new site lock settings
7. WHEN site lock settings are fetched THEN the password hash SHALL be excluded from public settings

### Requirement 7: Admin UI Updates

**User Story:** As a site administrator, I want an intuitive interface to configure password-protected site lock, so that I can easily set it up without technical knowledge.

#### Acceptance Criteria

1. WHEN an admin views the site lock setting THEN they SHALL see a radio button group for mode selection
2. WHEN "Require Password" mode is selected THEN a password input field SHALL appear
3. WHEN an admin enters a password THEN it SHALL be validated for minimum length (8 characters)
4. WHEN an admin saves the password THEN they SHALL see a confirmation message
5. WHEN an admin views the setting after saving THEN the password field SHALL show placeholder text (not the actual password)
6. WHEN an admin wants to change the password THEN they SHALL enter a new password and save
7. WHEN an admin disables site lock THEN the password SHALL remain stored but not enforced
8. WHEN an admin enables password mode THEN they SHALL see a warning about sharing the password securely

### Requirement 8: Security Considerations

**User Story:** As a security-conscious developer, I want the password-protected site lock to follow security best practices, so that it provides meaningful protection without vulnerabilities.

#### Acceptance Criteria

1. WHEN a password is submitted THEN it SHALL be sent over HTTPS only
2. WHEN a password is hashed THEN it SHALL use bcrypt with appropriate cost factor (10+)
3. WHEN password verification fails THEN the response SHALL not indicate whether the password exists
4. WHEN rate limiting is applied THEN password attempts SHALL be limited to prevent brute force (5 attempts per 15 minutes per IP)
5. WHEN a password session is created THEN it SHALL use a cryptographically secure random token
6. WHEN the password hash is stored THEN it SHALL never be included in API responses
7. WHEN the password prompt page is displayed THEN it SHALL include CSRF protection
8. WHEN password attempts are made THEN they SHALL be logged for security monitoring

### Requirement 9: Admin Banner Updates

**User Story:** As an administrator, I want to see a clear indicator when password-protected site lock is active, so that I know the current site access mode.

#### Acceptance Criteria

1. WHEN password-protected site lock is active THEN admins SHALL see a banner: "🔒 Password Lock Active - Password required for access"
2. WHEN authentication-based site lock is active THEN admins SHALL see a banner: "🔒 Site Lock Active - Authentication required for access"
3. WHEN maintenance mode is active THEN the maintenance banner SHALL take precedence
4. WHEN an admin views the banner THEN it SHALL clearly indicate which mode is active
5. WHEN the site lock mode changes THEN the banner SHALL update on next page load

### Requirement 10: Migration and Backwards Compatibility

**User Story:** As a developer, I want the new password-protected site lock to work alongside existing functionality, so that current implementations are not broken.

#### Acceptance Criteria

1. WHEN the feature is deployed THEN existing `site_lock_enabled` boolean SHALL be migrated to `site_lock_mode`
2. WHEN `site_lock_enabled` is true THEN it SHALL be converted to `site_lock_mode: "auth"`
3. WHEN `site_lock_enabled` is false THEN it SHALL be converted to `site_lock_mode: "off"`
4. WHEN the migration runs THEN existing site lock behavior SHALL be preserved
5. WHEN the settings cache is updated THEN it SHALL handle both old and new setting formats
6. WHEN the middleware is updated THEN it SHALL support both authentication and password modes
7. WHEN the admin UI is updated THEN it SHALL show the current mode correctly

### Requirement 11: Error Handling and Fallbacks

**User Story:** As a developer, I want robust error handling for password-protected site lock, so that failures don't break the site.

#### Acceptance Criteria

1. WHEN password verification fails due to server error THEN the user SHALL see a generic error message
2. WHEN the password hash is missing but password mode is enabled THEN the system SHALL fall back to disabled mode
3. WHEN the settings fail to load THEN the system SHALL default to site lock disabled
4. WHEN the password session cookie is corrupted THEN the user SHALL be prompted for the password again
5. WHEN the password hashing fails THEN the error SHALL be logged and the admin SHALL be notified
6. WHEN the middleware encounters an error THEN it SHALL fail open (allow access) and log the error

### Requirement 12: Testing and Validation

**User Story:** As a developer, I want comprehensive tests for password-protected site lock, so that I can be confident it works correctly.

#### Acceptance Criteria

1. WHEN password mode is enabled THEN automated tests SHALL verify the password prompt page is shown
2. WHEN the correct password is entered THEN automated tests SHALL verify access is granted
3. WHEN an incorrect password is entered THEN automated tests SHALL verify access is denied
4. WHEN a valid password session exists THEN automated tests SHALL verify no prompt is shown
5. WHEN the password is changed THEN automated tests SHALL verify old sessions are invalidated
6. WHEN an admin is logged in THEN automated tests SHALL verify password protection is bypassed
7. WHEN rate limiting is active THEN automated tests SHALL verify excessive attempts are blocked
