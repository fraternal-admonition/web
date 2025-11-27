# Requirements Document

## Introduction

This feature enables authenticated users to submit their letters to the Letters to Goliath contest. Users will access the contest through a dedicated "Contest" page in the navbar (visible only when logged in), view contest details including the submission deadline, and submit their entry with a title, letter body, illustration choice, and a 100-character note explaining their illustration selection. 

The submission process is designed as a two-step flow: first, the user creates and saves their submission (status: PENDING_PAYMENT), then completes payment of the $7 entry fee via Stripe. Only after successful payment is the submission officially marked as SUBMITTED and assigned a unique submission code for anonymous tracking. Users who don't pay immediately can return to complete payment before the submission deadline, with clear visibility of the deadline throughout the experience.

The design prioritizes a clean, uncluttered interface with the illustration selection presented in a modal dialog rather than inline on the form. The submission code must be guaranteed unique across all submissions, using a format that is memorable but not overly complex.

## Requirements

### Requirement 1: Contest Page and Navigation

**User Story:** As a logged-in user, I want to see a "Contest" link in the navbar and access a dedicated contest page, so that I can learn about the contest and begin my submission.

#### Acceptance Criteria

1. WHEN a user is logged in THEN the system SHALL display a "Contest" link in the main navigation bar
2. WHEN a user is not logged in THEN the system SHALL NOT display the "Contest" link in the navigation bar
3. WHEN a logged-in user clicks the "Contest" link THEN the system SHALL navigate to the contest page at `/contest`
4. WHEN a user accesses the contest page THEN the system SHALL display a wide, styled contest card with contest details
5. WHEN the contest page displays THEN the system SHALL show the contest title, description, current phase, and submission deadline prominently
6. WHEN the contest phase is SUBMISSIONS_OPEN THEN the system SHALL display a clear call-to-action button to begin submission
7. WHEN the contest phase is not SUBMISSIONS_OPEN THEN the system SHALL display appropriate messaging indicating submissions are closed
8. WHEN a user views the contest card THEN the system SHALL display the submission deadline in a clear, non-marketing style
9. WHEN no active contest exists THEN the system SHALL display a message indicating no contest is currently available

### Requirement 2: Submission Form Access and Flow

**User Story:** As a user viewing the contest page, I want to click a button to start my submission, so that I can begin writing my letter to Goliath.

#### Acceptance Criteria

1. WHEN a user clicks the "Submit Your Letter" button on the contest card THEN the system SHALL navigate to the submission form page at `/contest/submit`
2. WHEN a user accesses the submission form page without being logged in THEN the system SHALL redirect them to the signin page
3. WHEN a user accesses the submission form page and email is not verified THEN the system SHALL display a message requiring email verification
4. WHEN a user accesses the submission form during SUBMISSIONS_OPEN phase THEN the system SHALL display the submission form
5. WHEN a user accesses the submission form outside SUBMISSIONS_OPEN phase THEN the system SHALL redirect to the contest page with an error message
6. WHEN the submission form loads THEN the system SHALL display the submission deadline prominently at the top
7. WHEN the submission form loads THEN the system SHALL display fields for title, letter body, illustration selection, and 100-character note

### Requirement 3: Submission Form Fields and Validation

**User Story:** As a user filling out the submission form, I want clear input fields with validation, so that I can provide all required information correctly.

#### Acceptance Criteria

1. WHEN a user enters a title THEN the system SHALL validate that the title is between 1 and 200 characters
2. WHEN a user enters letter body text THEN the system SHALL accept plain text input without rich formatting
3. WHEN a user enters letter body text THEN the system SHALL validate the text meets minimum and maximum word count requirements from contest settings
4. WHEN a user enters the 100-character note THEN the system SHALL validate that the note is exactly 100 characters or less
5. WHEN a user attempts to submit without selecting an illustration THEN the system SHALL display a validation error
6. WHEN a user attempts to submit with missing required fields THEN the system SHALL display inline validation errors for each missing field
7. WHEN a user enters text exceeding maximum limits THEN the system SHALL display a character/word counter showing remaining allowance
8. WHEN validation errors exist THEN the system SHALL disable the submit button until errors are resolved

### Requirement 4: Illustration Selection Modal

**User Story:** As a user filling out the submission form, I want to click a button to open a modal showing all available illustrations, so that I can browse and select one without cluttering the main form.

#### Acceptance Criteria

1. WHEN a user clicks the "Choose Illustration" button THEN the system SHALL open a modal dialog displaying all active illustrations
2. WHEN the illustration modal opens THEN the system SHALL display illustrations in a responsive grid layout with thumbnails
3. WHEN the illustration modal displays THEN the system SHALL show only illustrations where is_active is true
4. WHEN a user hovers over an illustration thumbnail THEN the system SHALL display the illustration title and description
5. WHEN a user clicks an illustration in the modal THEN the system SHALL select that illustration and close the modal
6. WHEN a user selects an illustration THEN the system SHALL display the selected illustration thumbnail on the main form
7. WHEN a user clicks outside the modal or presses ESC THEN the system SHALL close the modal without changing the selection
8. WHEN no illustrations are available THEN the system SHALL display a message indicating illustrations are being prepared
9. WHEN the modal displays illustrations THEN the system SHALL show the illustration title beneath each thumbnail

### Requirement 5: Draft Submission Creation

**User Story:** As a user completing the submission form, I want to save my submission as a draft before payment, so that my work is preserved if payment fails or I need to return later.

#### Acceptance Criteria

1. WHEN a user clicks the "Continue to Payment" button with valid form data THEN the system SHALL create a submission record with status PENDING_PAYMENT
2. WHEN a submission is created THEN the system SHALL generate a unique submission_code using a format that is memorable and not overly complex
3. WHEN a submission_code is generated THEN the system SHALL verify uniqueness across all submissions in the database
4. WHEN a submission is created THEN the system SHALL store the user_id, contest_id, title, body, illustration_id, note, and submission_code
5. WHEN a submission is created THEN the system SHALL set created_at and updated_at timestamps
6. WHEN a submission creation fails THEN the system SHALL display an error message and allow the user to retry
7. WHEN a submission is successfully created THEN the system SHALL redirect the user to the payment page with the submission_id

### Requirement 6: Submission Code Generation

**User Story:** As a system administrator, I want submission codes to be guaranteed unique and follow a consistent format, so that users can easily reference their submissions anonymously.

#### Acceptance Criteria

1. WHEN a submission_code is generated THEN the system SHALL use a format combining contest identifier and unique identifier (e.g., "LTG-ABC123")
2. WHEN a submission_code is generated THEN the system SHALL ensure the code is between 8 and 16 characters in length
3. WHEN a submission_code is generated THEN the system SHALL use only uppercase letters and numbers for clarity
4. WHEN a submission_code is generated THEN the system SHALL verify uniqueness by checking existing submissions in the database
5. IF a generated submission_code already exists THEN the system SHALL regenerate a new code and retry verification
6. WHEN a submission_code is generated THEN the system SHALL use a cryptographically secure random generator for the unique portion
7. WHEN a submission_code is stored THEN the system SHALL create a unique constraint on the submission_code column to prevent duplicates

### Requirement 7: Payment Page and Stripe Integration

**User Story:** As a user who has created a draft submission, I want to pay the $7 entry fee via Stripe, so that my submission is officially entered into the contest.

#### Acceptance Criteria

1. WHEN a user is redirected to the payment page THEN the system SHALL display the submission_code and submission details
2. WHEN the payment page loads THEN the system SHALL display the entry fee amount ($7 USD) clearly
3. WHEN a user clicks "Pay Entry Fee" THEN the system SHALL create a Stripe Checkout session with purpose ENTRY_FEE
4. WHEN creating a Stripe Checkout session THEN the system SHALL include the submission_id in the metadata
5. WHEN creating a Stripe Checkout session THEN the system SHALL set the success_url to return to a confirmation page
6. WHEN creating a Stripe Checkout session THEN the system SHALL set the cancel_url to return to the payment page
7. WHEN a Stripe Checkout session is created THEN the system SHALL redirect the user to the Stripe-hosted checkout page
8. WHEN a user completes payment on Stripe THEN Stripe SHALL redirect the user to the success_url
9. WHEN a user cancels payment on Stripe THEN Stripe SHALL redirect the user to the cancel_url with a message

### Requirement 8: Stripe Webhook Processing

**User Story:** As a system, I want to receive and process Stripe webhook events, so that submissions are updated to SUBMITTED status when payment is confirmed.

#### Acceptance Criteria

1. WHEN Stripe sends a checkout.session.completed webhook THEN the system SHALL verify the webhook signature
2. WHEN a webhook signature is invalid THEN the system SHALL return a 400 error and log the attempt
3. WHEN a valid webhook is received THEN the system SHALL extract the submission_id from the session metadata
4. WHEN a webhook is processed THEN the system SHALL create or update a payment record with status PAID
5. WHEN a payment record is created THEN the system SHALL store the Stripe payment_intent_id, amount, currency, and purpose ENTRY_FEE
6. WHEN a payment is confirmed THEN the system SHALL update the submission status from PENDING_PAYMENT to SUBMITTED
7. WHEN a submission status is updated to SUBMITTED THEN the system SHALL set the submitted_at timestamp
8. WHEN webhook processing is complete THEN the system SHALL return a 200 response to Stripe
9. WHEN a webhook is received for an already-processed payment THEN the system SHALL handle it idempotently without creating duplicate records
10. WHEN webhook processing fails THEN the system SHALL log the error and return a 500 response for Stripe to retry

### Requirement 9: Payment Confirmation and Email

**User Story:** As a user who has completed payment, I want to see a confirmation page with my submission code and receive a confirmation email, so that I have a record of my submission.

#### Acceptance Criteria

1. WHEN a user returns from successful Stripe payment THEN the system SHALL display a confirmation page
2. WHEN the confirmation page loads THEN the system SHALL display the submission_code prominently
3. WHEN the confirmation page loads THEN the system SHALL display a success message confirming the submission is complete
4. WHEN the confirmation page loads THEN the system SHALL display a reminder to save the submission_code for future reference
5. WHEN a submission is marked as SUBMITTED THEN the system SHALL send a confirmation email to the user
6. WHEN a confirmation email is sent THEN the email SHALL include the submission_code, submission title, and contest details
7. WHEN a confirmation email is sent THEN the email SHALL include a receipt for the $7 entry fee
8. WHEN a confirmation email is sent THEN the email SHALL remind the user that submissions are anonymous and tracked by submission_code
9. WHEN a user views the confirmation page THEN the system SHALL provide a link to return to the dashboard

### Requirement 10: Returning to Incomplete Submissions

**User Story:** As a user who created a draft submission but didn't complete payment, I want to easily return and complete payment before the deadline, so that my submission is officially entered.

#### Acceptance Criteria

1. WHEN a user has a submission with status PENDING_PAYMENT THEN the system SHALL display a prominent alert on the dashboard
2. WHEN the dashboard alert displays THEN the system SHALL show the submission_code, title, and time remaining until deadline
3. WHEN a user clicks the alert THEN the system SHALL navigate to the payment page for that submission
4. WHEN a user accesses the payment page for a PENDING_PAYMENT submission THEN the system SHALL display the submission details and payment button
5. WHEN the submission deadline has passed THEN the system SHALL not allow payment for PENDING_PAYMENT submissions
6. WHEN a user attempts to pay after the deadline THEN the system SHALL display an error message indicating submissions are closed
7. WHEN a user has multiple PENDING_PAYMENT submissions THEN the system SHALL display all of them in the dashboard alert

### Requirement 11: Contest Phase Enforcement

**User Story:** As a system administrator, I want submissions to only be accepted during the SUBMISSIONS_OPEN phase, so that the contest timeline is enforced.

#### Acceptance Criteria

1. WHEN the contest phase is SUBMISSIONS_OPEN THEN the system SHALL allow users to create new submissions
2. WHEN the contest phase is not SUBMISSIONS_OPEN THEN the system SHALL prevent users from accessing the submission form
3. WHEN a user attempts to access the submission form outside SUBMISSIONS_OPEN THEN the system SHALL redirect to the contest page with an error message
4. WHEN the contest phase changes from SUBMISSIONS_OPEN to SUBMISSIONS_CLOSED THEN the system SHALL prevent new submissions
5. WHEN the contest phase is SUBMISSIONS_CLOSED THEN the system SHALL still allow payment for existing PENDING_PAYMENT submissions created before the deadline
6. WHEN the submission deadline passes THEN the system SHALL display appropriate messaging on the contest page
7. WHEN checking contest phase THEN the system SHALL compare current time with submissions_open_at and submissions_close_at timestamps

### Requirement 12: Error Handling and User Feedback

**User Story:** As a user interacting with the submission system, I want clear error messages and feedback, so that I understand what went wrong and how to fix it.

#### Acceptance Criteria

1. WHEN a form validation error occurs THEN the system SHALL display inline error messages next to the relevant fields
2. WHEN a submission creation fails THEN the system SHALL display a toast notification with a user-friendly error message
3. WHEN a payment fails THEN the system SHALL display an error message and allow the user to retry
4. WHEN a Stripe Checkout session creation fails THEN the system SHALL log the error and display a generic error message
5. WHEN a webhook processing error occurs THEN the system SHALL log detailed error information for debugging
6. WHEN a user attempts an action without authentication THEN the system SHALL redirect to signin with a message
7. WHEN a database error occurs THEN the system SHALL display a generic error message without exposing technical details
8. WHEN a user successfully completes an action THEN the system SHALL display a success toast notification

### Requirement 13: Security and Authorization

**User Story:** As a system administrator, I want submission and payment endpoints to be secure and properly authorized, so that only authenticated users can submit and pay.

#### Acceptance Criteria

1. WHEN a user accesses the submission form THEN the system SHALL verify the user is authenticated
2. WHEN a user creates a submission THEN the system SHALL verify the user_id matches the authenticated user
3. WHEN a user accesses the payment page THEN the system SHALL verify the submission belongs to the authenticated user
4. WHEN a webhook is received THEN the system SHALL verify the Stripe webhook signature
5. WHEN a user attempts to pay for another user's submission THEN the system SHALL return a 403 Forbidden error
6. WHEN a banned user attempts to submit THEN the system SHALL redirect to the banned page
7. WHEN API endpoints are called THEN the system SHALL implement rate limiting to prevent abuse
8. WHEN sensitive data is logged THEN the system SHALL redact payment information and personal details

### Requirement 14: Dashboard Integration

**User Story:** As a user with submissions, I want to see my submission status on the dashboard, so that I can track my entries and pending payments.

#### Acceptance Criteria

1. WHEN a user views the dashboard THEN the system SHALL display a count of their submissions
2. WHEN a user has PENDING_PAYMENT submissions THEN the system SHALL display a prominent alert with payment links
3. WHEN a user has SUBMITTED submissions THEN the system SHALL display a list of submission codes
4. WHEN a user clicks a submission code on the dashboard THEN the system SHALL navigate to a submission detail page
5. WHEN the dashboard displays submission counts THEN the system SHALL include both PENDING_PAYMENT and SUBMITTED statuses
6. WHEN a user has no submissions THEN the system SHALL display a call-to-action to visit the contest page

### Requirement 15: Admin Submission Management

**User Story:** As an administrator, I want to view and manage all submissions, so that I can monitor contest participation and handle edge cases.

#### Acceptance Criteria

1. WHEN an admin accesses the admin submissions page THEN the system SHALL display a list of all submissions
2. WHEN the admin submissions list displays THEN the system SHALL show submission_code, status, user email, title, and created_at
3. WHEN an admin clicks a submission THEN the system SHALL display full submission details including body and illustration
4. WHEN an admin views submission details THEN the system SHALL display the submission_code but NOT the user's real name
5. WHEN an admin filters submissions THEN the system SHALL support filtering by status, contest, and date range
6. WHEN an admin searches submissions THEN the system SHALL support searching by submission_code or title
7. WHEN an admin views a PENDING_PAYMENT submission THEN the system SHALL display an option to manually mark as SUBMITTED
8. WHEN an admin manually updates a submission status THEN the system SHALL log the action in audit_logs
9. WHEN an admin exports submissions THEN the system SHALL generate a CSV with anonymized data (submission_code, not user names)
