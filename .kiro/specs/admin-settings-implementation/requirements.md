# Requirements Document

## Introduction

The admin settings system currently allows administrators to save configuration values (site_name, maintenance_mode, site_lock_enabled) to the database, but these settings have no functional implementation. Users can toggle maintenance mode or site lock, but nothing happens on the frontend. This feature will implement the actual behavior for these three critical settings, making them functional and intuitive for both administrators and end users.

## Requirements

### Requirement 1: Site Name Display and SEO

**User Story:** As a site administrator, I want the site name setting to control the browser title and meta tags, so that my branding is consistent across the entire site.

#### Acceptance Criteria

1. WHEN the site_name setting is updated THEN the browser tab title SHALL display the site name on all pages
2. WHEN a page has a specific title THEN the browser tab SHALL display "{Page Title} | {Site Name}"
3. WHEN the home page is loaded THEN the browser tab SHALL display only the site name
4. WHEN the site_name setting is updated THEN the meta title tag SHALL be updated for SEO
5. WHEN the site_name setting is not set THEN the system SHALL use the default value "Fraternal Admonition"
6. WHEN the site_name setting changes THEN the change SHALL be reflected immediately on next page load without requiring a deployment
7. WHEN generating Open Graph meta tags THEN the system SHALL include the site name in og:site_name

### Requirement 2: Maintenance Mode Implementation

**User Story:** As a site administrator, I want to enable maintenance mode to show a maintenance page to all visitors while I perform updates, so that users see a professional message instead of broken functionality.

#### Acceptance Criteria

1. WHEN maintenance_mode is set to true THEN all non-admin users SHALL see a maintenance page
2. WHEN maintenance_mode is set to true THEN admin users SHALL still be able to access the full site
3. WHEN a non-admin user visits any public page during maintenance THEN they SHALL see a branded maintenance page with the site logo
4. WHEN a non-admin user visits any public page during maintenance THEN they SHALL see a message explaining the site is under maintenance
5. WHEN a non-admin user visits any public page during maintenance THEN they SHALL see an estimated return time or "check back soon" message
6. WHEN maintenance_mode is set to false THEN all users SHALL access the site normally
7. WHEN an admin is viewing the site during maintenance mode THEN they SHALL see a banner indicating "Maintenance Mode Active - Only admins can see this"
8. WHEN maintenance_mode changes THEN the change SHALL take effect immediately on next page load
9. WHEN a user is on the site and maintenance mode is enabled THEN their current session SHALL continue until they navigate or refresh
10. WHEN maintenance_mode is active THEN API routes SHALL return 503 Service Unavailable for non-admin requests
11. WHEN maintenance_mode is active THEN admin API routes SHALL continue to function normally

### Requirement 3: Site Lock Implementation

**User Story:** As a site administrator, I want to enable site lock to restrict access to authenticated users only, so that I can run a private beta or development phase before public launch.

#### Acceptance Criteria

1. WHEN site_lock_enabled is set to true THEN unauthenticated users SHALL be redirected to the sign-in page
2. WHEN site_lock_enabled is set to true THEN authenticated users SHALL access the site normally
3. WHEN an unauthenticated user tries to access any public page with site lock enabled THEN they SHALL be redirected to /auth/signin with a return URL
4. WHEN an unauthenticated user signs in during site lock THEN they SHALL be redirected to their originally requested page
5. WHEN site_lock_enabled is set to false THEN all users SHALL access public pages without authentication
6. WHEN site_lock_enabled is true THEN the sign-in page SHALL display a message "This site is currently in private access mode"
7. WHEN site_lock_enabled changes THEN the change SHALL take effect immediately on next page load
8. WHEN site_lock_enabled is true THEN public API routes SHALL return 401 Unauthorized for unauthenticated requests
9. WHEN site_lock_enabled is true THEN the home page SHALL still be accessible but show a "Sign in to continue" message for unauthenticated users
10. WHEN site_lock_enabled is true THEN admin routes SHALL continue to require admin role (not just authentication)

### Requirement 4: Settings Caching and Performance

**User Story:** As a developer, I want settings to be cached efficiently, so that every page load doesn't require a database query for settings.

#### Acceptance Criteria

1. WHEN settings are fetched THEN the system SHALL cache them for a reasonable duration (5 minutes)
2. WHEN a setting is updated via the admin panel THEN the cache SHALL be invalidated immediately
3. WHEN multiple pages load simultaneously THEN the system SHALL deduplicate settings queries
4. WHEN settings are cached THEN the cache SHALL be stored in memory or Redis (if available)
5. WHEN the server restarts THEN settings SHALL be fetched fresh from the database
6. WHEN settings fail to load THEN the system SHALL use default values and log the error

### Requirement 5: Admin Indicators and Overrides

**User Story:** As an administrator, I want clear visual indicators when special modes are active, so that I know the current state of the site and can test functionality.

#### Acceptance Criteria

1. WHEN maintenance_mode is active and an admin is logged in THEN a banner SHALL display at the top of every page saying "⚠️ Maintenance Mode Active - Only admins can see this site"
2. WHEN site_lock_enabled is active and an admin is logged in THEN a banner SHALL display at the top of every page saying "🔒 Site Lock Active - Only authenticated users can access"
3. WHEN both maintenance_mode and site_lock_enabled are active THEN only the maintenance mode banner SHALL display (maintenance takes precedence)
4. WHEN an admin views the settings page THEN each setting SHALL show its current status (Active/Inactive)
5. WHEN an admin toggles a setting THEN they SHALL see immediate feedback about what the setting does
6. WHEN an admin enables maintenance mode THEN they SHALL see a confirmation dialog explaining that non-admin users will be blocked

### Requirement 6: Error Handling and Fallbacks

**User Story:** As a developer, I want robust error handling for settings, so that a settings failure doesn't break the entire site.

#### Acceptance Criteria

1. WHEN settings fail to load from the database THEN the system SHALL use default values from the schema
2. WHEN a setting has an invalid value THEN the system SHALL use the default value and log a warning
3. WHEN the database is unavailable THEN the system SHALL use cached settings if available
4. WHEN the database is unavailable and no cache exists THEN the system SHALL use default values
5. WHEN a setting is missing from the database THEN the system SHALL use the default value without error
6. WHEN settings cause an error THEN the error SHALL be logged but SHALL NOT crash the application

### Requirement 7: Testing and Validation

**User Story:** As a developer, I want comprehensive tests for settings functionality, so that I can be confident the implementation works correctly.

#### Acceptance Criteria

1. WHEN maintenance mode is enabled THEN automated tests SHALL verify non-admin users see the maintenance page
2. WHEN maintenance mode is enabled THEN automated tests SHALL verify admin users can still access the site
3. WHEN site lock is enabled THEN automated tests SHALL verify unauthenticated users are redirected
4. WHEN site lock is enabled THEN automated tests SHALL verify authenticated users can access the site
5. WHEN site name is changed THEN automated tests SHALL verify the browser title updates
6. WHEN settings are cached THEN automated tests SHALL verify cache invalidation works
7. WHEN settings fail to load THEN automated tests SHALL verify fallback to defaults

### Requirement 8: Documentation and Admin Guidance

**User Story:** As a site administrator, I want clear documentation about what each setting does, so that I can use them confidently without technical knowledge.

#### Acceptance Criteria

1. WHEN an admin views a setting THEN the description SHALL clearly explain what the setting does
2. WHEN an admin hovers over a setting THEN a tooltip MAY provide additional context
3. WHEN an admin enables maintenance mode THEN they SHALL see a warning about the impact
4. WHEN an admin enables site lock THEN they SHALL see a warning about the impact
5. WHEN documentation is provided THEN it SHALL include examples of when to use each setting
6. WHEN documentation is provided THEN it SHALL include troubleshooting steps for common issues

