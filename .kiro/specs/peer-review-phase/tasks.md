# Implementation Plan: Peer Review Phase (Phase 5)

## Overview

This implementation plan breaks down the Peer Review Phase into discrete, manageable coding tasks. The system is triggered automatically when an admin changes the contest phase to PEER_REVIEW (via phase dropdown in contest edit form OR "Update to Suggested" button). The trigger is implemented by intercepting the phase change in the contest update API route. Each reviewer evaluates 10 randomly assigned submissions using four criteria (1-5 scale) plus a comment. Peer scores are calculated using trimmed means, and authors who don't complete their reviews are disqualified.

---

## Task List

- [x] 1. Database Schema Creation via Supabase MCP
  - Use Supabase MCP to create peer_review_assignments table
  - Use Supabase MCP to create peer_review_reviews table
  - Add indexes for performance (reviewer_user_id, submission_id, deadline)
  - Add unique constraint on (submission_id, reviewer_user_id) in peer_review_assignments
  - Verify foreign key constraints are created correctly
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 2. Assignment Service - Core Logic

  - [x] 2.1 Create assignment service module
    - Create `src/lib/peer-review/assignment-service.ts`
    - Define TypeScript interfaces for Assignment, Reviewer, Submission
    - Export main `executePeerReviewAssignments(contestId)` function
    - _Requirements: 1.1, 3.1_

  - [x] 2.2 Implement eligible submission query
    - Query submissions with status SUBMITTED or REINSTATED for the contest
    - Return list of eligible submissions
    - Log count of eligible submissions
    - _Requirements: 1.2, 1.3, 1.4_

  - [x] 2.3 Implement eligible reviewer query
    - Query users who have at least one submission with status SUBMITTED or REINSTATED
    - Exclude banned users (is_banned = true)
    - Return list of eligible reviewers
    - Log count of eligible reviewers
    - _Requirements: 1.5, 5.1, 5.2, 5.3_

  - [x] 2.4 Implement balanced assignment algorithm
    - Create algorithm that assigns 10 submissions to each reviewer
    - Prevent self-review (reviewer cannot review their own submission)
    - Balance review counts across submissions (minimize variance)
    - Handle edge cases (fewer than 10 submissions available)
    - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 4.3_

  - [x] 2.5 Implement assignment creation with deadline
    - Get deadline configuration from admin settings (default 7 days)
    - Calculate deadline as now + configured days
    - Create peer_review_assignments records in batches
    - Set status = PENDING, assigned_at = now, deadline = calculated
    - Handle database errors with retry logic (up to 3 attempts)
    - _Requirements: 3.4, 3.5, 6.1, 6.2, 6.3, 6.4_

  - [x] 2.6 Add transaction handling and logging
    - Wrap assignment logic in database transaction
    - Implement rollback on failure
    - Log assignment distribution statistics
    - Log any warnings (insufficient submissions, etc.)
    - _Requirements: 4.4, 4.5_


- [x] 2.7 Implement Phase Change Trigger in Admin API
  - Modify `/api/admin/contests/[id]/route.ts` PATCH handler
  - Detect when phase is being changed to PEER_REVIEW
  - Get current phase before update to check if it's actually changing
  - After successful contest update, check if phase changed TO PEER_REVIEW
  - If yes, import and call `executePeerReviewAssignments(contestId, 10, 7)` asynchronously
  - Don't block the API response - let assignment creation run in background
  - Log success/failure of assignment creation
  - Ensure idempotency - only trigger if phase actually changed (not if already PEER_REVIEW)
  - _Requirements: 1.1_

- [x] 3. Assignment Service - Email Notifications
  - [x] 3.1 Create assignment notification email template
    - Design HTML email template matching existing style
    - Include assignment count (10), deadline, and call-to-action button
    - Include link to reviewer dashboard
    - Add plain text version
    - _Requirements: 22.1_

  - [x] 3.2 Implement email sending function
    - Create `sendPeerReviewAssignmentEmail()` in `src/lib/email.ts`
    - Use Resend API to send emails
    - Include reviewer name, assignment count, and deadline
    - Handle email failures gracefully (log but don't fail assignment)
    - _Requirements: 22.1_

  - [x] 3.3 Integrate email sending into assignment service
    - Call email function after successful assignment creation
    - Send emails asynchronously to avoid blocking
    - Respect rate limits (600ms between emails)
    - Log email delivery status
    - _Requirements: 22.1, 23.5_

- [x] 4. Reviewer Dashboard - UI Components
  - [x] 4.1 Create reviewer dashboard page
    - Create `src/app/dashboard/peer-review-tasks/page.tsx`
    - Implement server-side data fetching for assignments
    - Verify user authentication
    - Pass assignments data to client component
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 4.2 Create peer review tasks client component
    - Create `src/app/dashboard/peer-review-tasks/PeerReviewTasksClient.tsx`
    - Display pending assignments count
    - Display completed assignments count
    - Display progress indicator (e.g., "3 of 10 completed")
    - Show deadline countdown for pending assignments
    - Implement "Start Review" button navigation
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 4.3 Create assignment card component
    - Create `src/components/peer-review/AssignmentCard.tsx`
    - Display assignment number (1 of 10, 2 of 10, etc.)
    - Display submission code (anonymous)
    - Display deadline with countdown timer
    - Display assignment status badge
    - Implement "Start Review" button
    - _Requirements: 7.3, 7.4_

  - [x] 4.4 Create progress card component
    - Create `src/components/peer-review/ProgressCard.tsx`
    - Display completion progress (e.g., "3 of 10 completed")
    - Display earliest deadline
    - Show warning if near deadline with incomplete reviews
    - _Requirements: 7.5_

  - [x] 4.5 Add peer review tasks link to main dashboard
    - Update `src/app/dashboard/page.tsx`
    - Add "Peer Review Tasks" section
    - Show pending assignment count badge
    - Add navigation link to peer review tasks page
    - _Requirements: 7.1_


- [x] 5. Reviewer Dashboard - API Routes
  - [x] 5.1 Create assignments API route
    - Create `/api/peer-review/assignments` route
    - Verify user authentication
    - Query peer_review_assignments for current user
    - Include related submission data (code, title, body_text only)
    - Exclude author identity and AI screening data
    - Return assignments grouped by status (PENDING, DONE, EXPIRED)
    - _Requirements: 7.1, 7.2_

  - [x] 5.2 Add security checks to assignments API
    - Verify user owns the assignments
    - Sanitize submission data (remove author info)
    - Rate limit API calls (max 60 per minute)
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 6. Anonymous Review Interface - UI Components
  - [x] 6.1 Create review page
    - Create `src/app/peer-review/review/[assignmentId]/page.tsx`
    - Implement server-side data fetching for assignment
    - Verify user owns assignment
    - Verify assignment status is PENDING
    - Verify assignment has not expired
    - Pass assignment data to client component
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 6.2 Create review client component
    - Create `src/app/peer-review/review/[assignmentId]/ReviewClient.tsx`
    - Display submission code, title, and body text only
    - Hide author identity, AI scores, and other reviews
    - Display anonymous review notice
    - Implement criteria rating state management (4 criteria, 1-5 scale)
    - Implement comment input with character counter
    - Implement form validation
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 6.3 Create criteria rating component
    - Create `src/components/peer-review/CriteriaRating.tsx`
    - Implement 1-5 star rating interface
    - Display criterion label and description
    - Show selected rating visually
    - Require selection before submission
    - _Requirements: 9.1, 9.2_

  - [x] 6.4 Create comment input component
    - Create `src/components/peer-review/CommentInput.tsx`
    - Implement textarea with 100 character limit
    - Display character counter
    - Show validation error if empty
    - _Requirements: 9.3, 9.4, 9.5_

  - [x] 6.5 Implement review submission handler
    - Create form submit handler
    - Validate all four criteria are rated
    - Validate comment is provided
    - Call review API route
    - Show loading state during submission
    - Navigate to next assignment or dashboard on success
    - Show error message on failure
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_


- [x] 7. Review Service - Backend Logic
  - [x] 7.1 Create review service module
    - Create `src/lib/peer-review/review-service.ts`
    - Define `submitReview()` function
    - Define `validateReview()` function
    - Define `checkSubmissionReviewCompletion()` function
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [x] 7.2 Implement review validation
    - Verify user owns the assignment
    - Verify assignment status is PENDING
    - Verify assignment has not expired (deadline > now)
    - Verify no existing peer_review_reviews record for assignment
    - Verify scores are between 1 and 5
    - _Requirements: 10.1, 10.2, 10.3, 24.1_

  - [x] 7.3 Implement review submission
    - Create peer_review_reviews record with all four scores and comment
    - Update peer_review_assignments status to DONE
    - Set completed_at timestamp
    - Log review submission
    - _Requirements: 10.4, 10.5_

  - [x] 7.4 Implement completion status check
    - Query all peer_review_assignments for the submission
    - Count assignments with status DONE
    - Return true if all assignments complete
    - Return completion count and total count
    - _Requirements: 14.1, 14.2_

  - [x] 7.5 Implement score calculation trigger
    - If all reviews complete, call scoring service asynchronously
    - Pass submission_id to score calculation function
    - Handle async execution (don't block review response)
    - _Requirements: 14.1, 14.2_

- [x] 8. Review Service - API Routes
  - [x] 8.1 Create review submission API route
    - Create `/api/peer-review/submit` route
    - Verify user authentication
    - Parse request body (assignment_id, clarity, argument, style, moral_depth, comment)
    - Call review service validation
    - Call review service submission
    - Return success/error response with completion status
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [x] 8.2 Add security logging
    - Log all review submissions with user_id and timestamp
    - Log validation failures with reason
    - Sanitize logs to remove PII
    - _Requirements: 10.1, 10.2, 10.3_


- [ ] 9. Scoring Service - Score Calculation
  - [x] 9.1 Create scoring service module
    - Create `src/lib/peer-review/scoring-service.ts`
    - Define `calculatePeerScore()` function
    - Define `calculateTrimmedMean()` function
    - Define `calculateOverallScore()` function
    - Define TypeScript interfaces for scoring
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

  - [x] 9.2 Implement review aggregation
    - Query all peer_review_reviews for the submission via peer_review_assignments
    - Extract scores for each criterion (clarity, argument, style, moral_depth)
    - Return arrays of scores for each criterion
    - _Requirements: 13.1_

  - [x] 9.3 Implement trimmed mean calculation
    - If 5 or more reviews, sort scores and remove highest and lowest
    - If fewer than 5 reviews, use all scores
    - Calculate mean of remaining scores
    - Return trimmed mean for each criterion
    - _Requirements: 13.2, 13.3_

  - [x] 9.4 Implement overall score calculation
    - Calculate average of four criterion means
    - Round to 2 decimal places
    - Return overall peer score
    - _Requirements: 13.4_

  - [x] 9.5 Implement score storage
    - Update submissions.score_peer with calculated score
    - Set updated_at timestamp
    - Log score calculation with value
    - _Requirements: 13.5, 14.5_

  - [x] 9.6 Write property test for trimmed mean calculation
    - **Property 11: Trimmed Mean for Large Samples**
    - **Validates: Requirements 13.2**
    - Generate random score arrays with 5+ values
    - Verify highest and lowest are excluded from calculation
    - Verify result equals mean of middle values

  - [x] 9.7 Write property test for simple mean calculation
    - **Property 12: Simple Mean for Small Samples**
    - **Validates: Requirements 13.3**
    - Generate random score arrays with <5 values
    - Verify all values are included in calculation
    - Verify result equals mean of all values

  - [ ] 9.8 Write property test for four-criteria average
    - **Property 13: Four-Criteria Average**
    - **Validates: Requirements 13.4**
    - Generate random criterion means
    - Verify overall score equals average of four means


- [ ] 10. Phase End Processing Service
  - [x] 10.1 Create phase end service module
    - Create `src/lib/peer-review/phase-end-service.ts`
    - Define `processPeerReviewPhaseEnd()` function
    - Define `enforceReviewObligations()` function
    - Define `finalizeAllScores()` function
    - Define `selectFinalists()` function
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 17.1, 17.2, 17.3, 17.4, 18.1, 18.2, 18.3, 18.4, 25.1, 25.2, 25.3, 25.4_

  - [x] 10.2 Implement review obligation enforcement
    - Query all reviewers for the contest
    - For each reviewer, count completed vs total assignments
    - If not all complete, update their submission status to DISQUALIFIED
    - Log all disqualifications with user_id and reason
    - Return list of disqualified user IDs
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

  - [x] 10.3 Implement score finalization
    - Query all submissions for the contest
    - For each submission, calculate peer score if not already calculated
    - Ensure all submissions have final peer scores
    - Log any submissions with missing scores
    - _Requirements: 25.1_

  - [x] 10.4 Implement finalist selection
    - Get finalist count configuration from admin settings (default 100)
    - Query all submissions for contest, order by score_peer DESC
    - Select top N submissions
    - Return list of finalist submissions
    - Log finalist selection criteria and count
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 18.1, 18.2, 18.3_

  - [x] 10.5 Implement phase transition
    - Update contest phase to PUBLIC_VOTING
    - Update contest updated_at timestamp
    - Log phase transition
    - _Requirements: 18.4, 25.4_

  - [x] 10.6 Integrate notification emails
    - Send disqualification emails to affected authors
    - Send finalist notification emails to selected authors
    - Handle email failures gracefully (log but don't fail process)
    - _Requirements: 12.3, 22.3, 25.5_

- [x] 11. Deadline Management Service
  - [x] 11.1 Create deadline management service module
    - Create `src/lib/peer-review/deadline-service.ts`
    - Define `checkExpiredAssignments()` function
    - Define `reassignExpiredAssignments()` function
    - Define `sendDeadlineWarnings()` function
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 22.2_

  - [x] 11.2 Implement expired assignment detection
    - Query assignments with deadline < NOW() and status PENDING
    - Update status to EXPIRED
    - Log expired assignments
    - _Requirements: 11.1_

  - [x] 11.3 Implement assignment reassignment
    - For each expired assignment, select a new reviewer
    - Exclude reviewers who already reviewed this submission
    - Exclude reviewers with multiple expired assignments
    - Create new peer_review_assignments record with fresh deadline
    - Send notification email to new reviewer
    - _Requirements: 11.2, 11.3, 11.4, 11.5_

  - [x] 11.4 Implement deadline warning emails
    - Query assignments with deadline within 24 hours
    - Send warning emails to reviewers
    - Mark as warned to avoid duplicate emails
    - _Requirements: 22.2_


- [x] 12. Deadline Management - Cron Jobs
  - [x] 12.1 Create deadline checking cron route
    - Create `/api/cron/peer-review/check-deadlines` route
    - Call deadline service to check and mark expired assignments
    - Call deadline service to reassign expired assignments
    - Return summary of actions taken
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [x] 12.2 Create deadline warnings cron route
    - Create `/api/cron/peer-review/send-warnings` route
    - Call deadline service to send 24h warnings
    - Return summary of emails sent
    - _Requirements: 22.2_

  - [x] 12.3 Configure Vercel cron jobs
    - Add cron configuration to `vercel.json`
    - Set hourly schedule for deadline checking
    - Set 6-hour schedule for warning emails
    - _Requirements: 11.1, 22.2_

- [x] 13. Results Display - UI Components
  - [x] 13.1 Create peer review results component
    - Create `src/components/peer-review/PeerReviewResults.tsx`
    - Display results header with score badge and rank
    - Display criteria breakdown (clarity, argument, style, moral_depth)
    - Display review statistics (count, overall score)
    - Show anonymized reviewer comments
    - Only render if results visibility is enabled by admin
    - _Requirements: 15.1, 15.2, 15.3, 16.1, 16.2, 16.3, 16.4, 16.5_

  - [x] 13.2 Create criteria breakdown component
    - Create `src/components/peer-review/CriteriaBreakdown.tsx`
    - Display score for each criterion with visual indicator
    - Show criterion labels and descriptions
    - Use color coding for score ranges
    - _Requirements: 16.2_

  - [x] 13.3 Create reviewer comments component
    - Create `src/components/peer-review/ReviewerComments.tsx`
    - Display each comment in a card
    - Anonymize reviewer identity (show as "Reviewer 1", "Reviewer 2", etc.)
    - _Requirements: 16.3_

  - [x] 13.4 Integrate results into submission detail page
    - Update submission detail page to include PeerReviewResults component
    - Check if peer_verification_result exists and results visibility is enabled
    - Render component if conditions met
    - Position appropriately in page layout
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_


- [x] 14. Admin Dashboard - Monitoring
  - [x] 14.1 Create admin peer review dashboard page
    - Create `src/app/admin/peer-review/page.tsx`
    - Verify admin authentication
    - Display peer review statistics
    - Show reviewer activity table
    - Show submission review table
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_

  - [x] 14.2 Create statistics grid component
    - Create `src/components/admin/PeerReviewStats.tsx`
    - Display total assignments, completed reviews, pending reviews
    - Display completion rate percentage
    - Display at-risk reviewers count
    - _Requirements: 19.1, 19.2, 19.3, 19.4_

  - [x] 14.3 Create reviewer activity table component
    - Create `src/components/admin/ReviewerActivityTable.tsx`
    - Display reviewer list with completion statistics
    - Show completion rate per reviewer
    - Highlight at-risk reviewers (near deadline with incomplete reviews)
    - Provide reassign action button
    - _Requirements: 19.3, 19.4_

  - [x] 14.4 Create submission review table component
    - Create `src/components/admin/SubmissionReviewTable.tsx`
    - Display submissions with review counts
    - Show submissions with insufficient reviews
    - Provide view details link
    - _Requirements: 19.5_

  - [x] 14.5 Create admin API routes
    - Create `/api/admin/peer-review/stats` route
    - Create `/api/admin/peer-review/reviewers` route
    - Create `/api/admin/peer-review/submissions` route
    - Verify admin authentication
    - Return aggregated data for dashboard
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_

- [x] 15. Admin Dashboard - Configuration
  - [x] 15.1 Create configuration panel component
    - Create `src/components/admin/PeerReviewConfig.tsx`
    - Display deadline configuration input (days)
    - Display finalist count configuration input
    - Display results visibility toggle
    - Implement save handlers for each setting
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 15.1, 15.2, 15.3, 15.4, 17.1, 17.2_

  - [x] 15.2 Create configuration API routes
    - Create `/api/admin/peer-review/config` route (GET and PUT)
    - Verify admin authentication
    - Store configuration in contest settings or separate config table
    - Log all configuration changes
    - _Requirements: 6.1, 6.2, 6.3, 15.1, 15.2, 15.3, 17.1, 17.2_

  - [x] 15.3 Create phase end button component
    - Create button to trigger phase end processing
    - Require confirmation modal before execution
    - Show loading state during processing
    - Display success/error message
    - Disable if phase already ended
    - _Requirements: 25.1, 25.2, 25.3, 25.4, 25.5_


- [x] 16. Admin Tools - Manual Intervention
  - [x] 16.1 Create manual reassignment functionality
    - Create `/api/admin/peer-review/reassign` route
    - Allow admin to manually reassign a specific assignment
    - Select new reviewer from eligible pool
    - Create new peer_review_assignments record
    - Mark old assignment as EXPIRED
    - Send notification email to new reviewer
    - Log admin action in audit_logs
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5_

  - [x] 16.2 Create score override functionality
    - Create `/api/admin/peer-review/override-score` route
    - Allow admin to manually edit individual review scores
    - Require written justification
    - Recalculate submission peer score after override
    - Log admin action in audit_logs with justification
    - Send notification email to submission author
    - _Requirements: 21.1, 21.2, 21.3, 21.4, 21.5_

  - [x] 16.3 Create admin override UI
    - Add "Reassign" button to reviewer activity table
    - Add "Override Score" button to submission review details
    - Create modal with reviewer selection for reassignment
    - Create modal with score editing and justification for override
    - Call API routes on submit
    - Show success/error message
    - _Requirements: 20.1, 20.2, 21.1, 21.2_

- [x] 17. Email Templates
  - [x] 17.1 Create deadline warning email template
    - Design HTML email template
    - Include assignment count and deadline (24 hours)
    - Include link to reviewer dashboard
    - Add plain text version
    - _Requirements: 22.2_

  - [x] 17.2 Create disqualification notice email template
    - Design HTML email template
    - Explain reason for disqualification (incomplete reviews)
    - Include submission code and title
    - Add plain text version
    - _Requirements: 22.3_

  - [x] 17.3 Create results available email template
    - Design HTML email template
    - Notify author that peer review results are now visible
    - Include link to submission detail page
    - Add plain text version
    - _Requirements: 22.4_

  - [x] 17.4 Create reassignment notification email template
    - Design HTML email template
    - Notify reviewer of new assignment due to expiration
    - Include deadline and link to review
    - Add plain text version
    - _Requirements: 22.5_

  - [x] 17.5 Implement email sending functions
    - Create `sendDeadlineWarningEmail()` in `src/lib/email.ts`
    - Create `sendDisqualificationEmail()` in `src/lib/email.ts`
    - Create `sendResultsAvailableEmail()` in `src/lib/email.ts`
    - Create `sendReassignmentEmail()` in `src/lib/email.ts`
    - Use Resend API for all emails
    - _Requirements: 22.1, 22.2, 22.3, 22.4, 22.5_


- [x] 18. Testing and Validation
  - [x] 18.1 Write property test for eligible submission selection
    - **Property 1: Eligible Submission Selection**
    - **Validates: Requirements 1.2, 1.3, 1.4**
    - Generate random submissions with various statuses
    - Verify only SUBMITTED and REINSTATED are selected

  - [x] 18.2 Write property test for eligible reviewer selection
    - **Property 2: Eligible Reviewer Selection**
    - **Validates: Requirements 1.5**
    - Generate random users with various submission statuses
    - Verify only users with eligible submissions are selected

  - [x] 18.3 Write property test for assignment count
    - **Property 3: Assignment Count Per Reviewer**
    - **Validates: Requirements 3.1**
    - Generate random reviewers and submissions
    - Verify each reviewer has exactly 10 assignments (or fewer if insufficient)

  - [x] 18.4 Write property test for no self-review
    - **Property 4: No Self-Review**
    - **Validates: Requirements 3.3**
    - Generate random assignments
    - Verify no assignment has matching reviewer and submission author

  - [x] 18.5 Write property test for balanced distribution
    - **Property 7: Balanced Review Distribution**
    - **Validates: Requirements 4.1, 4.2, 4.3**
    - Generate random reviewers and submissions
    - Verify review count variance is minimized

  - [x] 18.6 Write unit tests for review validation
    - Test ownership validation (reject if user doesn't own assignment)
    - Test status validation (reject if not PENDING)
    - Test expiration validation (reject if past deadline)
    - _Requirements: 10.1, 10.2, 10.3_

  - [x] 18.7 Write unit tests for score calculation
    - Test trimmed mean with 5+ reviews
    - Test simple mean with <5 reviews
    - Test four-criteria average
    - Test edge cases (all same scores, extreme outliers)
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

  - [x] 18.8 Perform manual testing
    - Test with small contest (10 submissions, 10 reviewers)
    - Test with medium contest (50 submissions, 50 reviewers)
    - Test assignment balance
    - Test review submission flow
    - Test score calculation
    - Test disqualification logic
    - Test finalist selection
    - _Requirements: All_

- [ ] 19. Documentation and Deployment
  - [ ] 19.1 Update API documentation
    - Document all new API routes
    - Include request/response examples
    - Document authentication requirements
    - Document rate limits
    - _Requirements: All_

  - [ ] 19.2 Create admin user guide
    - Document how to trigger peer review phase
    - Document how to configure deadline and finalist count
    - Document how to monitor progress
    - Document how to reassign assignments
    - Document how to override scores
    - Document how to end phase and select finalists
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 20.1, 20.2, 21.1, 21.2_

  - [ ] 19.3 Create reviewer user guide
    - Document how to access assignments
    - Document how to complete reviews
    - Document review criteria and scoring
    - Document deadlines and consequences
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ] 19.4 Deploy to staging environment
    - Run database migrations (create new tables)
    - Deploy backend services
    - Deploy frontend components
    - Configure cron jobs
    - Test all functionality
    - _Requirements: All_

  - [ ] 19.5 Deploy to production
    - Schedule deployment during low-traffic window
    - Deploy backend services
    - Deploy frontend components
    - Configure cron jobs
    - Monitor logs for errors
    - Test with real contest
    - _Requirements: All_

---

## Notes

- Each task includes requirement references for traceability
- Tasks should be completed in order to ensure dependencies are met
- The peer review phase is triggered manually by admin, not automatically
- Each reviewer evaluates exactly 10 submissions
- Assignment algorithm balances review counts across submissions
- Trimmed mean removes outliers for submissions with 5+ reviews
- Authors who don't complete all reviews are automatically disqualified
- All email templates should match existing project style
- Admin tools provide full visibility and manual override capability

---

## Key Differences from Peer Verification

1. **Phase-Based**: Triggered manually by admin, not by payment
2. **Balanced Assignment**: Each reviewer gets 10 submissions, balanced across all submissions
3. **Four Criteria**: Uses clarity, argument, style, moral_depth (not just Eliminate/Reinstate)
4. **Trimmed Mean**: Removes outliers for fair scoring
5. **Disqualification**: Non-completion results in automatic disqualification
6. **Separate Tables**: Uses peer_review_assignments and peer_review_reviews (not peer_assignments and peer_reviews)
