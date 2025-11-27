# Implementation Plan

- [x] 1. Create settings schema and type definitions



  - Create `src/lib/cms/setting-types.ts` with TypeScript interfaces for SettingType, SettingDefinition, SettingCategory, SettingValue, etc.
  - Create `src/lib/cms/settings-schema.ts` with SETTING_CATEGORIES and SETTINGS_SCHEMA arrays
  - Define initial settings: site_name, maintenance_mode, max_upload_size_mb, site_lock_enabled, contact_email
  - _Requirements: 1.1, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 5.1, 5.2_

- [x] 2. Implement settings service layer



  - Create `src/lib/cms/settings-service.ts` with getAllSettings(), getSettingByKey(), and validateSettingValue() functions
  - Implement logic to merge schema definitions with database values
  - Implement validation logic for each setting type (boolean, string, number, select, textarea)
  - Handle default values when settings don't exist in database
  - _Requirements: 4.7, 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 8.1, 8.2, 8.3, 8.4_

- [x] 3. Create reusable control components



  - Create `src/components/admin/settings/BooleanControl.tsx` with toggle switch UI
  - Create `src/components/admin/settings/TextControl.tsx` supporting both single-line and textarea modes
  - Create `src/components/admin/settings/NumberControl.tsx` with min/max validation
  - Create `src/components/admin/settings/SelectControl.tsx` with dropdown options
  - Apply consistent theming (#F9F9F7, #C19A43, #004D40, #E5E5E0) to all controls
  - _Requirements: 1.2, 1.3, 1.4, 1.5, 2.2_

- [x] 4. Create dynamic setting control wrapper



  - Create `src/components/admin/settings/SettingControl.tsx` that renders appropriate control based on setting type
  - Implement dirty state tracking to show save button only when value changes
  - Implement reset to default functionality
  - Display setting label, description, required indicator, and validation errors
  - Apply consistent card styling with white background, border, shadow, and padding
  - _Requirements: 1.1, 1.6, 1.8, 2.3, 2.4, 2.5_

- [x] 5. Update settings page with new UI



  - Update `src/app/admin/cms/settings/page.tsx` to use getAllSettings() and pass data to client component
  - Rewrite `src/app/admin/cms/settings/SettingsClient.tsx` with category tabs navigation
  - Implement category filtering to show only settings for active category
  - Add success/error message display at top of page
  - Implement handleSave function to call API and update UI state
  - Apply consistent page layout and theming matching other admin pages
  - _Requirements: 1.1, 1.7, 2.1, 2.3, 2.6, 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 6. Update settings API endpoints



  - Update `src/app/api/admin/cms/settings/route.ts` GET handler to return schema-merged settings
  - Create `src/app/api/admin/cms/settings/[key]/route.ts` for key-based operations (replacing ID-based)
  - Implement PUT handler with schema validation using validateSettingValue()
  - Implement upsert logic (insert if not exists, update if exists)
  - Maintain audit logging for all setting changes
  - Return appropriate error responses with validation details
  - _Requirements: 6.1, 6.2, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 8.5_

- [x] 7. Remove Assets page from navigation


  - Update `src/app/admin/layout.tsx` to remove Assets link from navigation menu
  - Update `src/app/admin/page.tsx` to remove Assets card from dashboard stats
  - Remove Assets quick action button from dashboard
  - Update dashboard to only fetch pages and settings counts (remove assets count query)

  - _Requirements: 3.1, 3.2_




- [x] 8. Add redirects for Assets routes
  - Update `src/app/admin/cms/assets/page.tsx` to redirect to /admin/cms/pages
  - Update `src/app/admin/cms/assets/upload/page.tsx` to redirect to /admin/cms/pages
  - Keep asset API routes functional for page editor usage
  - _Requirements: 3.3, 3.4, 3.5_

- [ ]* 9. Add validation and error handling tests
  - Write unit tests for validateSettingValue() covering all setting types
  - Write unit tests for getAllSettings() and getSettingByKey()
  - Write integration tests for settings API endpoints
  - Write component tests for each control component
  - _Requirements: 7.1, 7.2_

- [ ]* 10. Add E2E tests for settings workflow
  - Test viewing settings page with categories
  - Test changing and saving a boolean setting
  - Test changing and saving a text setting with validation
  - Test reset to default functionality
  - Test validation error display
  - Test Assets page redirect
  - _Requirements: 1.1, 1.2, 1.3, 1.6, 1.7, 1.8, 3.4_
