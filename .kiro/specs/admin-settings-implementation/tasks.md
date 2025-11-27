# Implementation Plan

- [x] 1. Create settings cache service



  - Create `src/lib/cms/settings-cache.ts` with SettingsCache class
  - Implement get() method with in-memory caching and 5-minute TTL
  - Implement invalidate() method to clear cache
  - Implement isExpired() method to check cache freshness
  - Add fetchFromDatabase() helper to load settings from Supabase
  - Add fallback to default values from SETTINGS_SCHEMA on error
  - Export singleton instance for use across the application
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 2. Implement site name in metadata






  - Update `src/app/layout.tsx` to fetch settings using settingsCache
  - Update generateMetadata() to use site_name from settings for title.default
  - Set title.template to include site name: `%s | ${site_name}`
  - Add site_name to openGraph.siteName
  - Verify browser tab shows site name on home page
  - Verify browser tab shows "{Page Title} | {Site Name}" on other pages
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [x] 3. Create maintenance page


  - Create `src/app/maintenance/page.tsx` with branded maintenance UI
  - Add site logo image display
  - Add "Under Maintenance" heading with serif font
  - Add maintenance message explaining the situation
  - Add "check back soon" message
  - Style with consistent colors (#F9F9F7 background, #222 text, #666 secondary text)
  - Make responsive for all screen sizes
  - _Requirements: 2.3, 2.4, 2.5_

- [x] 4. Create admin banner component


  - Create `src/components/admin/AdminBanner.tsx` as client component
  - Add MaintenanceModeBanner with orange background and warning icon
  - Add SiteLockBanner with blue background and lock icon
  - Implement logic to show maintenance banner when maintenanceMode is true
  - Implement logic to show site lock banner when siteLockEnabled is true (and maintenance is false)
  - Return null when no special modes are active
  - Style banners with consistent padding, centering, and font weight
  - _Requirements: 5.1, 5.2, 5.3_


- [x] 5. Integrate admin banner in root layout






  - Update `src/app/layout.tsx` to fetch user and check if admin
  - Fetch settings using settingsCache
  - Add AdminBanner component above children (only render if user is admin)
  - Pass maintenanceMode and siteLockEnabled props to AdminBanner
  - Ensure banner appears on all pages for admin users
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 6. Update middleware for maintenance mode



  - Update `middleware.ts` to import settingsCache
  - Add helper function to get user from request
  - Add helper function to check if user is admin
  - After existing subdomain logic, fetch settings using settingsCache.get()
  - Skip settings checks for admin routes, auth routes, and API routes
  - Check if maintenance_mode is true and user is not admin
  - If maintenance mode active for non-admin, rewrite to /maintenance page
  - Wrap settings logic in try-catch to fail open on error
  - _Requirements: 2.1, 2.2, 2.6, 2.7, 2.8, 2.9, 6.6_

- [ ] 7. Update middleware for site lock
  - In `middleware.ts`, after maintenance mode check, check site_lock_enabled
  - If site lock enabled and user is not authenticated, redirect to /auth/signin
  - Add redirect query parameter with original URL for post-login redirect
  - Ensure authenticated users can access site normally
  - Ensure admin routes still require admin role (not just authentication)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.7, 3.10_

- [ ] 8. Update sign-in page for site lock
  - Update `src/app/auth/signin/page.tsx` to check if site lock is enabled
  - If site lock enabled, display message "This site is currently in private access mode"
  - Style message consistently with existing sign-in page design
  - Ensure redirect parameter is preserved after sign-in
  - _Requirements: 3.6_

- [ ] 9. Create API protection helpers
  - Create `src/lib/middleware/api-protection.ts` with helper functions
  - Implement checkMaintenanceMode() to return 503 for non-admin during maintenance
  - Implement checkSiteLock() to return 401 for unauthenticated during site lock
  - Add proper HTTP headers (Retry-After for 503)
  - Return null if checks pass (no blocking)
  - _Requirements: 2.10, 2.11, 3.8_


- [ ] 10. Update settings API to invalidate cache
  - Update `src/app/api/admin/cms/settings/[key]/route.ts` PUT handler
  - Import settingsCache from settings-cache.ts
  - After successful database update, call settingsCache.invalidate()
  - Ensure cache invalidation happens before returning response
  - Test that settings changes take effect immediately on next request
  - _Requirements: 4.2_

- [ ] 11. Add confirmation dialogs for critical settings
  - Update `src/components/admin/settings/SettingControl.tsx` to detect critical settings
  - Add confirmation dialog when enabling maintenance_mode
  - Add confirmation dialog when enabling site_lock_enabled
  - Dialog should explain impact: "Non-admin users will be blocked" for maintenance
  - Dialog should explain impact: "Unauthenticated users will need to sign in" for site lock
  - Require explicit confirmation before saving
  - _Requirements: 5.6_

- [ ] 12. Update settings schema descriptions
  - Update `src/lib/cms/settings-schema.ts` for site_name setting
  - Update description to mention browser title and meta tags
  - Update `src/lib/cms/settings-schema.ts` for maintenance_mode setting
  - Update description to clearly explain non-admin users will see maintenance page
  - Update `src/lib/cms/settings-schema.ts` for site_lock_enabled setting
  - Update description to clearly explain unauthenticated users will be redirected
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ]* 13. Write unit tests for settings cache
  - Write test for cache hit (data returned from cache)
  - Write test for cache miss (data fetched from database)
  - Write test for cache expiration (TTL exceeded, refetch from database)
  - Write test for cache invalidation (manual clear)
  - Write test for fallback to defaults on database error
  - _Requirements: 7.6_

- [ ]* 14. Write integration tests for maintenance mode
  - Write test: Enable maintenance mode via API
  - Write test: Non-admin user sees maintenance page
  - Write test: Admin user sees normal site with banner
  - Write test: Disable maintenance mode
  - Write test: All users see normal site
  - _Requirements: 7.1, 7.2_


- [ ]* 15. Write integration tests for site lock
  - Write test: Enable site lock via API
  - Write test: Unauthenticated user redirected to sign-in
  - Write test: Sign in as regular user
  - Write test: Authenticated user can access site
  - Write test: Disable site lock
  - Write test: Unauthenticated user can access site
  - _Requirements: 7.3, 7.4_

- [ ]* 16. Write integration tests for site name
  - Write test: Update site name via API
  - Write test: Browser title updates on home page
  - Write test: Browser title updates on other pages with template
  - Write test: Meta tags include new site name
  - Write test: OpenGraph siteName includes new site name
  - _Requirements: 7.5_

