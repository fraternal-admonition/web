# Implementation Plan

- [x] 1. Set up types and validation schemas


  - Create `src/types/contests.ts` with Contest, Illustration, ContestPhase types and form data interfaces
  - Add ContestSchema and IllustrationSchema to `src/lib/security/validators.ts`
  - _Requirements: 1.1, 1.2, 3.1, 3.2, 5.1, 5.2, 5.7_

- [x] 2. Create Contest API routes

  - [x] 2.1 Implement GET /api/admin/contests route


    - Fetch all contests with ordering by created_at
    - Include submission count via join or separate query
    - Apply admin authentication check
    - Return contests array with proper error handling
    - _Requirements: 1.7, 6.3, 6.6, 6.7_

  - [x] 2.2 Implement POST /api/admin/contests route


    - Validate request body with ContestSchema
    - Check for duplicate slug if provided
    - Insert contest with default phase 'SUBMISSIONS_OPEN'
    - Log audit event for contest creation
    - Return created contest with 201 status
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 5.1, 5.2, 6.3, 6.5_

  - [x] 2.3 Implement GET /api/admin/contests/[id] route


    - Fetch single contest by ID
    - Include related data (teaser asset, submission count)
    - Apply admin authentication check
    - Handle not found case
    - _Requirements: 1.8, 6.3_


  - [x] 2.4 Implement PATCH /api/admin/contests/[id] route


    - Validate request body with ContestSchema (partial)
    - Check for duplicate slug if slug is being changed
    - Update contest fields including phase if provided
    - Update updated_at timestamp
    - Log audit event for contest update
    - Return updated contest
    - _Requirements: 1.8, 2.3, 2.4, 5.2, 5.3, 6.3, 6.5_


  - [x] 2.5 Implement DELETE /api/admin/contests/[id] route


    - Check if contest has any submissions
    - Prevent deletion if submissions exist
    - Delete contest if no submissions
    - Log audit event for contest deletion
    - Return success response
    - _Requirements: 1.9, 5.4, 6.3, 6.5_

- [x] 3. Create Illustration API routes


  - [x] 3.1 Implement GET /api/admin/contests/[id]/illustrations route


    - Fetch all illustrations for a contest
    - Join with cms_assets to get image paths
    - Order by created_at
    - Apply admin authentication check
    - _Requirements: 3.1, 6.3_


  - [x] 3.2 Implement POST /api/admin/contests/[id]/illustrations route


    - Validate request body with IllustrationSchema
    - Check for duplicate title within contest
    - Verify asset_id exists in cms_assets if provided
    - Insert illustration with is_active default true
    - Log audit event for illustration creation
    - Return created illustration with 201 status
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 5.7, 6.3, 6.5_

  - [x] 3.3 Implement PATCH /api/admin/illustrations/[id] route


    - Validate request body with IllustrationSchema (partial)
    - Check for duplicate title if title is being changed
    - Update illustration fields including is_active
    - Log audit event for illustration update
    - Return updated illustration
    - _Requirements: 3.6, 3.7, 3.8, 5.7, 6.3, 6.5_



  - [x] 3.4 Implement DELETE /api/admin/illustrations/[id] route

    - Check if illustration is referenced by any submissions
    - Prevent deletion if submissions exist
    - Delete illustration if no submissions
    - Log audit event for illustration deletion
    - Return success response
    - _Requirements: 3.9, 5.5, 6.3, 6.5_


- [x] 4. Create Contest list page


  - [x] 4.1 Implement /admin/contests page



    - Use requireAdmin() for authentication
    - Fetch contests with submission counts
    - Display contests in table with columns: title, slug, phase, dates, actions
    - Show phase badge with color coding based on phase value
    - Include "New Contest" button in header
    - Show empty state if no contests exist
    - Handle loading and error states
    - _Requirements: 1.7, 2.2, 6.1, 6.2, 6.4_

  - [x] 4.2 Create DeleteContestButton client component


    - Implement confirmation dialog before deletion
    - Call DELETE API endpoint
    - Show error if contest has submissions
    - Refresh page on successful deletion
    - Display toast notifications for success/error
    - _Requirements: 1.9, 5.4_

- [x] 5. Create Contest form pages


  - [x] 5.1 Implement /admin/contests/new page


    - Use requireAdmin() for authentication
    - Render ContestForm component in create mode
    - Handle form submission to POST API
    - Redirect to contest list on success
    - Display validation errors inline
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 5.1, 6.1, 6.2_


  - [x] 5.2 Implement /admin/contests/[id] page

    - Use requireAdmin() for authentication
    - Fetch existing contest data
    - Render ContestForm component in edit mode
    - Handle form submission to PATCH API
    - Show success message on update
    - Display validation errors inline
    - _Requirements: 1.8, 2.3, 5.1, 5.3, 6.1, 6.2_

  - [x] 5.3 Create ContestForm client component


    - Form fields: title, slug, all phase timestamps, max_entries, phase selector
    - Use datetime-local inputs for timestamps
    - Implement client-side validation
    - Show loading state during submission
    - Display API errors as toast notifications
    - Cancel button to navigate back
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.8, 2.3, 5.1, 5.2, 5.3_

- [x] 6. Create Illustration management pages


  - [x] 6.1 Implement /admin/contests/[id]/illustrations page



    - Use requireAdmin() for authentication
    - Fetch contest details and illustrations
    - Display illustrations in grid layout with thumbnails
    - Show illustration title, status badge (active/inactive)
    - Include "Add Illustration" button
    - Show empty state if no illustrations exist
    - _Requirements: 3.1, 3.10, 6.1, 6.2_

  - [x] 6.2 Implement /admin/contests/[id]/illustrations/new page


    - Use requireAdmin() for authentication
    - Render IllustrationForm component in create mode
    - Handle form submission to POST API
    - Redirect to illustrations list on success
    - Display validation errors inline
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 5.7, 6.1, 6.2_


  - [x] 6.3 Create IllustrationForm client component

    - Form fields: title, description, image upload, is_active toggle
    - Integrate with existing CMS asset upload API
    - Show image preview after upload
    - Implement client-side validation
    - Show loading state during submission
    - Display API errors as toast notifications
    - Cancel button to navigate back
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.8, 5.7, 5.8_

  - [x] 6.4 Create IllustrationCard client component

    - Display illustration thumbnail using Next.js Image
    - Show title and active status badge
    - Edit button to navigate to edit page
    - Toggle active/inactive button with confirmation
    - Delete button with confirmation dialog
    - Handle API calls for toggle and delete actions
    - _Requirements: 3.1, 3.6, 3.7, 3.9, 5.5_

- [x] 7. Update admin dashboard


  - [x] 7.1 Add contest statistics to admin dashboard


    - Fetch contest count from database
    - Display "Contests" card with count and description
    - Link card to /admin/contests
    - _Requirements: 4.1, 4.3_

  - [x] 7.2 Add illustration statistics to admin dashboard

    - Fetch active illustration count from database
    - Display "Illustrations" card with count and description
    - Link card to contests page (or first contest's illustrations)
    - _Requirements: 4.2, 4.4_

  - [x] 7.3 Add quick action for creating contests


    - Add "Create New Contest" button to quick actions section
    - Link to /admin/contests/new
    - _Requirements: 4.5, 4.6_

- [x] 8. Create shared UI components


  - [x] 8.1 Create PhaseIndicator component


    - Display phase name with color-coded badge
    - Color mapping: SUBMISSIONS_OPEN (green), SUBMISSIONS_CLOSED (gray), AI_FILTERING (blue), PEER_REVIEW (purple), PUBLIC_VOTING (orange), FINALIZED (teal)
    - Optional tooltip with phase description
    - _Requirements: 2.2, 2.7_

  - [x] 8.2 Create ConfirmDialog component


    - Reusable confirmation dialog with title, message, confirm/cancel buttons
    - Support for danger actions (red confirm button)
    - Accessible with keyboard navigation
    - _Requirements: 1.9, 3.9, 5.4, 5.5_

- [x] 9. Add navigation and routing


  - [x] 9.1 Update admin layout navigation


    - Add "Contests" link to admin sidebar/navigation
    - Position after "Posts" and before "Settings"
    - Highlight active state when on contest pages
    - _Requirements: 4.3_

  - [x] 9.2 Create breadcrumb navigation for contest pages


    - Show breadcrumb trail: Admin > Contests > [Contest Title] > Illustrations
    - Make breadcrumb items clickable links
    - Display current page as non-clickable text
    - _Requirements: 1.7, 3.1_

- [x] 10. Implement phase transition logic


  - [x] 10.1 Create phase calculation utility


    - Function to determine current phase based on timestamps
    - Compare current time with all phase timestamps
    - Return appropriate phase enum value
    - Handle edge cases (no timestamps set, overlapping windows)
    - _Requirements: 2.1_

  - [x] 10.2 Add phase display to public contest view


    - Create utility to check if submissions are open
    - Display current phase status on public pages
    - Show appropriate messaging based on phase
    - _Requirements: 2.7_

- [x] 11. Error handling and validation

  - [x] 11.1 Implement comprehensive error handling in API routes


    - Catch and log all database errors
    - Return appropriate HTTP status codes
    - Provide user-friendly error messages
    - Handle foreign key constraint violations specifically
    - _Requirements: 5.4, 5.5, 5.6_

  - [x] 11.2 Add client-side form validation


    - Validate required fields before submission
    - Check slug format (lowercase, alphanumeric, hyphens)
    - Validate datetime formats
    - Show inline validation errors
    - Disable submit button when form is invalid
    - _Requirements: 5.1, 5.2, 5.3, 5.7_

- [x] 12. Testing and polish


  - [x] 12.1 Manual testing of contest CRUD operations


    - Test creating contest with all fields
    - Test creating contest with minimal fields
    - Test editing contest and changing phase
    - Test deleting empty contest
    - Test preventing deletion of contest with submissions
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9_

  - [x] 12.2 Manual testing of illustration CRUD operations

    - Test uploading and creating illustration
    - Test editing illustration title and description
    - Test toggling illustration active status
    - Test deleting unused illustration
    - Test preventing deletion of illustration with submissions
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10_

  - [x] 12.3 Test authorization and security

    - Verify non-admin users cannot access contest pages
    - Verify unauthenticated users are redirected to signin
    - Verify banned users are redirected appropriately
    - Check audit logs are created for all operations
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [x] 12.4 Test phase transitions and display

    - Verify phase indicator displays correctly for all phases
    - Test manual phase override functionality
    - Verify phase affects submission availability
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [x] 12.5 UI/UX polish and accessibility

    - Verify responsive design on mobile and tablet
    - Test keyboard navigation for all forms and dialogs
    - Ensure proper focus management
    - Verify color contrast meets WCAG AA standards
    - Test with screen reader (basic check)
    - _Requirements: All UI-related requirements_
