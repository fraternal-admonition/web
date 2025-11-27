# Implementation Plan

- [x] 1. Set up types, validation schemas, and utilities


  - Create `src/types/submissions.ts` with Submission, Payment, SubmissionStatus, PaymentPurpose types and interfaces
  - Add SubmissionSchema and PaymentIntentSchema to `src/lib/security/validators.ts`
  - Create `src/lib/submissions/submission-code.ts` with unique code generation logic
  - Create `src/lib/contests/phase-utils.ts` with phase status and deadline formatting utilities
  - _Requirements: 3.1, 3.2, 3.3, 5.1, 5.2, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 11.1, 11.7_

- [x] 2. Create Contest page and navigation



  - [x] 2.1 Update Navbar to show "Contest" link when user is logged in


    - Modify `src/components/Navbar.tsx` to conditionally render "Contest" link based on auth state
    - Add link to `/contest` in both desktop and mobile navigation
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 2.2 Create Contest landing page at `/contest`


    - Create `src/app/contest/page.tsx` with server-side contest data fetching
    - Fetch active contest with phase and deadline information
    - Display contest card with title, description, phase badge, and deadline
    - Show "Submit Your Letter" CTA button when phase is SUBMISSIONS_OPEN
    - Show appropriate messaging when submissions are closed
    - Handle case when no active contest exists
    - _Requirements: 1.4, 1.5, 1.6, 1.7, 1.8, 1.9_

  - [x] 2.3 Create ContestCard component


    - Create `src/components/contest/ContestCard.tsx` client component
    - Style with gradient background, clean typography, and prominent CTA
    - Display deadline in clear, non-marketing format
    - Include phase badge with color coding
    - Make CTA button link to `/contest/submit`
    - _Requirements: 1.4, 1.5, 1.6, 1.7, 1.8_

- [x] 3. Create Submission Form page



  - [x] 3.1 Create submission form page at `/contest/submit`


    - Create `src/app/contest/submit/page.tsx` with authentication check
    - Redirect unauthenticated users to signin
    - Check email verification status
    - Verify contest phase is SUBMISSIONS_OPEN
    - Fetch active illustrations for the contest
    - Display deadline prominently at top of page
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 11.1, 11.2, 11.3_

  - [x] 3.2 Create SubmissionForm client component


    - Create `src/components/contest/SubmissionForm.tsx`
    - Title input with character counter (max 200)
    - Body textarea with word counter (min 100, max 10000 words)
    - "Choose Illustration" button to open modal
    - Selected illustration preview display
    - 100-character note input with counter
    - Form validation with inline error messages
    - "Continue to Payment" button (disabled when invalid)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

  - [x] 3.3 Create IllustrationModal component


    - Create `src/components/contest/IllustrationModal.tsx` client component
    - Full-screen modal with close button (X and ESC key)
    - Responsive grid layout for illustration thumbnails
    - Display only active illustrations
    - Show title beneath each thumbnail
    - Hover effect to display description
    - Click illustration to select and close modal
    - Click outside modal to close without selection
    - Handle empty state when no illustrations available
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9_

- [x] 4. Create submission API endpoints



  - [x] 4.1 Create POST /api/submissions route


    - Create `src/app/api/submissions/route.ts`
    - Verify user authentication
    - Validate request body with SubmissionSchema
    - Check contest phase is SUBMISSIONS_OPEN
    - Check if max_entries limit reached (if set)
    - Generate unique submission_code using utility
    - Create submission record with status PENDING_PAYMENT
    - Return submission_id and submission_code
    - Handle errors with appropriate status codes
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 11.1, 11.2, 13.1, 13.2_

  - [x] 4.2 Create GET /api/submissions/user route


    - Create `src/app/api/submissions/user/route.ts`
    - Verify user authentication
    - Fetch all submissions for authenticated user
    - Include related data (illustration, contest)
    - Order by created_at descending
    - Return submissions array
    - _Requirements: 14.1, 14.2, 14.3, 14.5_

  - [x] 4.3 Create GET /api/submissions/[id] route


    - Create `src/app/api/submissions/[id]/route.ts`
    - Verify user authentication
    - Fetch submission by ID
    - Verify submission belongs to authenticated user
    - Include related data (illustration, contest, payment)
    - Return submission details
    - Return 403 if user doesn't own submission
    - _Requirements: 13.3, 13.5_

- [x] 5. Create Payment page and Stripe integration


  - [x] 5.1 Create payment page at `/contest/payment/[submissionId]`


    - Create `src/app/contest/payment/[submissionId]/page.tsx`
    - Verify user authentication
    - Fetch submission by ID
    - Verify submission belongs to authenticated user
    - Verify submission status is PENDING_PAYMENT
    - Check if deadline has passed
    - Display submission code prominently
    - Display submission details (title, excerpt)
    - Display entry fee amount ($7 USD)
    - Show "Pay Entry Fee" button
    - Show deadline and time remaining
    - _Requirements: 7.1, 7.2, 10.4, 11.5, 11.6_

  - [x] 5.2 Create POST /api/payments/create-checkout route


    - Create `src/app/api/payments/create-checkout/route.ts`
    - Verify user authentication
    - Validate request body with PaymentIntentSchema
    - Fetch submission and verify ownership
    - Verify submission status is PENDING_PAYMENT
    - Check deadline hasn't passed
    - Create Stripe Checkout session with metadata (submission_id, user_id)
    - Set success_url to `/contest/confirmation/[submissionId]`
    - Set cancel_url to `/contest/payment/[submissionId]`
    - Create payment record with status PENDING
    - Return checkout_url and session_id
    - _Requirements: 7.3, 7.4, 7.5, 7.6, 7.7, 11.5, 13.3, 13.4_

- [x] 6. Create Stripe webhook handler



  - [x] 6.1 Create POST /api/webhooks/stripe route


    - Create `src/app/api/webhooks/stripe/route.ts`
    - Verify Stripe webhook signature
    - Handle checkout.session.completed event
    - Extract submission_id from session metadata
    - Update payment record to status PAID
    - Store Stripe payment_intent_id and customer_id
    - Update submission status from PENDING_PAYMENT to SUBMITTED
    - Set submitted_at timestamp
    - Handle idempotency (check if already processed)
    - Return 200 on success, 400 on invalid signature, 500 on error
    - Log all webhook events for monitoring
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10, 13.4_

- [x] 7. Create Confirmation page and email




  - [x] 7.1 Create confirmation page at `/contest/confirmation/[submissionId]`

    - Create `src/app/contest/confirmation/[submissionId]/page.tsx`
    - Verify user authentication
    - Fetch submission by ID
    - Verify submission belongs to authenticated user
    - Verify submission status is SUBMITTED
    - Display success message with animation
    - Display submission_code prominently (large, copyable)
    - Show reminder to save submission_code
    - Display "Return to Dashboard" button
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.9_


  - [x] 7.2 Create email sending utility and template

    - Create `src/lib/email/submission-confirmation.ts`
    - Create HTML email template with submission_code, title, contest details
    - Include payment receipt information ($7 entry fee)
    - Add reminder about anonymity and submission_code tracking
    - Send email when submission status changes to SUBMITTED
    - Integrate with webhook handler to trigger email
    - _Requirements: 9.5, 9.6, 9.7, 9.8_

- [x] 8. Update Dashboard with submission alerts



  - [x] 8.1 Update dashboard page to show submissions


    - Modify `src/app/dashboard/page.tsx`
    - Fetch user's submissions (both PENDING_PAYMENT and SUBMITTED)
    - Display submission count in stats card
    - Show list of SUBMITTED submissions with codes
    - _Requirements: 14.1, 14.3, 14.5_

  - [x] 8.2 Create DashboardSubmissionAlert component


    - Create `src/components/dashboard/SubmissionAlert.tsx`
    - Display prominent alert for PENDING_PAYMENT submissions
    - Show submission_code, title, and deadline
    - Calculate and display time remaining
    - Include "Complete Payment" button linking to payment page
    - Show alert for each pending submission
    - Style with warning colors (yellow/orange)
    - _Requirements: 10.1, 10.2, 10.3, 10.7_

  - [x] 8.3 Create SubmissionList component


    - Create `src/components/dashboard/SubmissionList.tsx`
    - Display list of SUBMITTED submissions
    - Show submission_code, title, and submitted date
    - Link to submission detail page (future)
    - Show empty state when no submissions
    - _Requirements: 14.3, 14.4_

- [x] 9. Create Admin submission management



  - [x] 9.1 Create admin submissions list page


    - Create `src/app/admin/submissions/page.tsx`
    - Use requireAdmin() for authentication
    - Fetch all submissions with user email and contest info
    - Display in table with columns: code, status, email, title, created_at
    - Add filters for status and contest
    - Add search by submission_code or title
    - Include pagination (50 per page)
    - Add "Export CSV" button
    - _Requirements: 15.1, 15.2, 15.5, 15.6, 15.9_

  - [x] 9.2 Create GET /api/admin/submissions route


    - Create `src/app/api/admin/submissions/route.ts`
    - Check admin authentication
    - Fetch all submissions with filters (status, contest, search)
    - Include user email and contest title
    - Support pagination with query params
    - Return submissions array with total count
    - _Requirements: 15.1, 15.2, 15.5, 15.6_
 
  - [x] 9.3 Create admin submission detail page


    - Create `src/app/admin/submissions/[id]/page.tsx`
    - Use requireAdmin() for authentication
    - Fetch submission with all related data
    - Display submission_code prominently (NOT user name)
    - Show full submission details (title, body, illustration, note)
    - Display status and timestamps
    - Show payment information if exists
    - Include "Mark as SUBMITTED" button for PENDING_PAYMENT submissions
    - _Requirements: 15.3, 15.4, 15.7_

  - [x] 9.4 Create PATCH /api/admin/submissions/[id] route


    - Create `src/app/api/admin/submissions/[id]/route.ts`
    - Check admin authentication
    - Allow updating submission status
    - Log action in audit_logs
    - Return updated submission
    - _Requirements: 15.7, 15.8_

- [x] 10. Error handling and user feedback



  - [x] 10.1 Add comprehensive error handling to all API routes


    - Catch and log all database errors
    - Return appropriate HTTP status codes (400, 403, 404, 500)
    - Provide user-friendly error messages
    - Handle Stripe API errors specifically
    - Redact sensitive information from error logs
    - _Requirements: 12.2, 12.3, 12.4, 12.5, 12.7, 13.8_

  - [x] 10.2 Add client-side form validation


    - Implement real-time validation for all form fields
    - Display inline error messages
    - Show character/word counters
    - Disable submit button when form is invalid
    - Validate illustration selection
    - _Requirements: 3.5, 3.6, 3.7, 3.8, 12.1_

  - [x] 10.3 Add toast notifications for user actions


    - Success toast for submission creation
    - Error toast for API failures
    - Success toast for payment completion
    - Info toast for redirects and phase changes
    - _Requirements: 12.2, 12.8_

- [x] 11. Security and authorization



  - [x] 11.1 Add authentication checks to all protected routes


    - Verify user authentication on submission pages
    - Verify admin role on admin pages
    - Redirect unauthenticated users to signin
    - Redirect banned users to banned page
    - _Requirements: 13.1, 13.6_

  - [x] 11.2 Add ownership verification for submissions


    - Verify user owns submission before allowing payment
    - Verify user owns submission before viewing details
    - Return 403 Forbidden for unauthorized access
    - _Requirements: 13.2, 13.3, 13.5_

  - [x] 11.3 Implement rate limiting for submission endpoints


    - Limit submission creation to 5 per hour per user
    - Limit payment checkout creation to 10 per hour per user
    - Use existing rate limiting middleware
    - _Requirements: 13.7_

- [ ] 12. Testing and polish
  - [ ] 12.1 Manual testing of submission flow
    - Test complete flow: form → payment → confirmation
    - Test form validation (all fields)
    - Test illustration modal interaction
    - Test deadline display and enforcement
    - Test returning to pending submission
    - Test payment cancellation flow
    - _Requirements: All submission and payment requirements_

  - [ ] 12.2 Manual testing of webhook processing
    - Test successful payment webhook
    - Test duplicate webhook (idempotency)
    - Test invalid signature handling
    - Test webhook with missing metadata
    - Verify email is sent after successful payment
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10_

  - [ ] 12.3 Manual testing of admin features
    - Test admin submissions list with filters
    - Test admin submission detail view
    - Test manual status update
    - Test CSV export
    - Verify audit logs are created
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 15.8, 15.9_

  - [ ] 12.4 Manual testing of dashboard integration
    - Test pending payment alerts display
    - Test submission list display
    - Test navigation from dashboard to payment
    - Test submission count updates
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 10.1, 10.2, 10.3, 10.7_

  - [ ] 12.5 UI/UX polish and accessibility
    - Verify responsive design on mobile and tablet
    - Test keyboard navigation for all forms and modals
    - Ensure proper focus management
    - Verify color contrast meets WCAG AA standards
    - Test with screen reader (basic check)
    - Ensure loading states are clear
    - Verify error messages are helpful
    - _Requirements: All UI-related requirements_ 