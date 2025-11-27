# Requirements Document

## Introduction

This feature enables administrators to configure and manage the Letters to Goliath (LtG) contest through an admin interface. Administrators need the ability to create contests with specific timeline windows for each phase (submissions, AI filtering, peer review, public voting), set entry limits, and manage a collection of 50 illustrations that writers can choose from when submitting their letters. The contest configuration is foundational infrastructure that must be in place before users can submit entries in Phase 3.

The system must support both automatic phase transitions based on configured timestamps and manual administrative overrides. The current contest phase must be clearly visible to both administrators and users. Illustrations must be manageable with active/inactive states and unique titles, and they will be displayed in a gallery format during the submission process.

## Requirements

### Requirement 1: Contest Creation and Management

**User Story:** As an administrator, I want to create and configure a Letters to Goliath contest with specific timeline windows for each phase, so that the contest progresses through its stages in an organized manner.

#### Acceptance Criteria

1. WHEN an administrator accesses the contest management interface THEN the system SHALL display a form to create a new contest with fields for title, slug, and all phase timestamps
2. WHEN an administrator creates a contest THEN the system SHALL validate that title is required and slug is unique
3. WHEN an administrator sets phase timestamps THEN the system SHALL accept nullable timestamp values for submissions_open_at, submissions_close_at, ai_filter_start_at, ai_filter_end_at, peer_start_at, peer_end_at, public_start_at, and public_end_at
4. WHEN an administrator sets max_entries THEN the system SHALL accept an optional integer value to limit total submissions
5. WHEN a contest is created THEN the system SHALL set the initial phase to 'SUBMISSIONS_OPEN' by default
6. WHEN an administrator saves a contest THEN the system SHALL store the record in the contests table with created_at and updated_at timestamps
7. WHEN an administrator views the contest list THEN the system SHALL display all contests with their current phase, title, and key dates
8. WHEN an administrator edits a contest THEN the system SHALL allow updating all contest fields including phase timestamps and max_entries
9. WHEN an administrator deletes a contest THEN the system SHALL prevent deletion if submissions exist for that contest

### Requirement 2: Contest Phase Management

**User Story:** As an administrator, I want the contest to automatically transition between phases based on configured timestamps, with the ability to manually override when needed, so that the contest progresses correctly without constant manual intervention.

#### Acceptance Criteria

1. WHEN the current time passes a phase start timestamp THEN the system SHALL automatically update the contest phase to the corresponding value
2. WHEN an administrator views the admin dashboard THEN the system SHALL display the current phase for each contest
3. WHEN an administrator manually changes the contest phase THEN the system SHALL update the phase field immediately regardless of timestamps
4. WHEN the contest phase changes THEN the system SHALL update the updated_at timestamp
5. IF the contest phase is 'SUBMISSIONS_OPEN' THEN the system SHALL allow new submissions to be created
6. IF the contest phase is 'SUBMISSIONS_CLOSED' THEN the system SHALL prevent new submissions from being created
7. WHEN a user views the public contest page THEN the system SHALL display the current phase status clearly

### Requirement 3: Illustration Management

**User Story:** As an administrator, I want to upload and manage a collection of 50 illustrations that writers can choose from, so that each submission can be associated with a visual element.

#### Acceptance Criteria

1. WHEN an administrator accesses the illustrations management interface THEN the system SHALL display a list of all illustrations with their title, status, and thumbnail
2. WHEN an administrator creates a new illustration THEN the system SHALL require a contest_id, title, and asset_id
3. WHEN an administrator uploads an illustration image THEN the system SHALL store the image in cms_assets and link it via asset_id
4. WHEN an administrator sets an illustration title THEN the system SHALL validate that the title is unique within the contest
5. WHEN an administrator creates an illustration THEN the system SHALL set is_active to true by default
6. WHEN an administrator marks an illustration as inactive THEN the system SHALL update is_active to false and exclude it from the submission form gallery
7. WHEN an administrator marks an illustration as active THEN the system SHALL update is_active to true and include it in the submission form gallery
8. WHEN an administrator adds a description to an illustration THEN the system SHALL store the optional description text
9. WHEN an administrator deletes an illustration THEN the system SHALL prevent deletion if submissions reference that illustration
10. WHEN the system displays illustrations in the submission form THEN the system SHALL only show illustrations where is_active is true

### Requirement 4: Contest Dashboard Integration

**User Story:** As an administrator, I want to see contest statistics and quick access links on the admin dashboard, so that I can efficiently manage contests alongside other site content.

#### Acceptance Criteria

1. WHEN an administrator views the admin dashboard THEN the system SHALL display a card showing the total number of contests
2. WHEN an administrator views the admin dashboard THEN the system SHALL display a card showing the total number of active illustrations
3. WHEN an administrator clicks on the contests card THEN the system SHALL navigate to the contest list page
4. WHEN an administrator clicks on the illustrations card THEN the system SHALL navigate to the illustrations list page
5. WHEN an administrator views the quick actions section THEN the system SHALL display a "Create New Contest" button
6. WHEN an administrator clicks "Create New Contest" THEN the system SHALL navigate to the contest creation form

### Requirement 5: Data Validation and Error Handling

**User Story:** As an administrator, I want the system to validate my input and provide clear error messages, so that I can correct mistakes and ensure data integrity.

#### Acceptance Criteria

1. WHEN an administrator submits a contest form with missing required fields THEN the system SHALL display validation errors for each missing field
2. WHEN an administrator enters a duplicate slug THEN the system SHALL display an error message indicating the slug must be unique
3. WHEN an administrator enters invalid timestamp values THEN the system SHALL display an error message with the expected format
4. WHEN an administrator attempts to delete a contest with submissions THEN the system SHALL display an error message preventing deletion
5. WHEN an administrator attempts to delete an illustration referenced by submissions THEN the system SHALL display an error message preventing deletion
6. WHEN a database operation fails THEN the system SHALL log the error and display a user-friendly error message
7. WHEN an administrator enters a duplicate illustration title within a contest THEN the system SHALL display an error message indicating titles must be unique

### Requirement 6: Authorization and Security

**User Story:** As a system administrator, I want only authorized admin users to access contest configuration features, so that the contest data remains secure and protected from unauthorized changes.

#### Acceptance Criteria

1. WHEN a non-admin user attempts to access contest management pages THEN the system SHALL redirect them to the dashboard
2. WHEN an unauthenticated user attempts to access contest management pages THEN the system SHALL redirect them to the signin page
3. WHEN an admin user accesses contest API endpoints THEN the system SHALL verify their admin role before processing requests
4. WHEN a banned user attempts to access contest management THEN the system SHALL redirect them to the banned page
5. WHEN an admin performs a contest operation THEN the system SHALL log the action in the audit_logs table
6. WHEN an API request fails authentication THEN the system SHALL return a 401 Unauthorized response
7. WHEN an API request fails authorization THEN the system SHALL return a 403 Forbidden response
