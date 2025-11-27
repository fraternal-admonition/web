# Implementation Plan: Peer Verification System

## Overview

This implementation plan breaks down the Peer Verification System into discrete, manageable coding tasks. Each task builds incrementally on previous work, ensuring the system can be developed and tested in stages.

---

## Task List

- [ ] 1. Database Schema Updates
  - Create migration file for all schema changes
  - Add decision column to peer_reviews table
  - Add peer_verification_result jsonb column to submissions table
  - Add integrity_score and qualified_evaluator columns to users table
  - Add new submission_status enum values (REINSTATED, PEER_REVIEW_CONFIRMED, PEER_REVIEW_UPHELD)
  - Add deadline column to peer_assignments table
  - Create database indexes for performance optimization
  - _Requirements: 1.1, 1.5, 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ] 2. Assignment Service - Core Logic
  - [ ] 2.1 Create assignment service module structure
    - Create `src/lib/peer-verification/assignment-service.ts`
    - Define TypeScript interfaces for Assignment, Reviewer, VerificationRequest
    - Export main `executeAssignments(contestId)` function
    - _Requirements: 1.1, 1.2_
  
  - [ ] 2.2 Implement verification request query
    - Write function to query submissions with status PEER_VERIFICATION_PENDING
    - Filter by contest_id
    - Include related data (user_id, submission_code, title)
    - _Requirements: 1.1_
  
  - [ ] 2.3 Implement eligible reviewer selection
    - Query users with at least one submission in the contest
    - Exclude banned users (is_banned = true)
    - Exclude submission authors from their own verification requests
    - Order by integrity_score DESC for prioritization
    - _Requirements: 1.2, 2.1, 2.2, 2.3, 2.4_
  
  - [ ] 2.4 Implement reviewer assignment algorithm
    - For each verification request, select 10 unique reviewers
    - Ensure even distribution of assignments across reviewer pool
    - Create peer_assignments records with status PENDING
    - Set deadline to 7 days from assignment
    - Handle edge case: fewer than 10 eligible reviewers
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 2.3_
  
  - [ ] 2.5 Implement submission assignment to reviewers
    - For each reviewer, assign 3 submissions:
      - 1 verification request (PEER_VERIFICATION_PENDING)
      - 1 accepted elimination (ELIMINATED with Option A flag)
      - 1 AI-passed submission (SUBMITTED)
    - Ensure no reviewer evaluates their own submission
    - Create peer_assignments records for all 3 submissions
    - Handle edge case: insufficient control submissions
    - _Requirements: 1.3, 1.4_
  
  - [ ] 2.6 Add transaction handling and error recovery
    - Wrap assignment logic in database transaction
    - Implement rollback on failure
    - Add retry logic (up to 3 attempts)
    - Log errors with sanitized data
    - _Requirements: 1.1, 1.5_

- [ ] 3. Assignment Service - Email Notifications
  - [ ] 3.1 Create assignment notification email template
    - Design HTML email template matching existing style
    - Include assignment count, deadline, and call-to-action button
    - Include link to reviewer dashboard
    - Add plain text version
    - _Requirements: 1.6, 15.1_
  
  - [ ] 3.2 Implement email sending function
    - Create `sendAssignmentNotificationEmail()` in `src/lib/email.ts`
    - Use Resend API to send emails
    - Include reviewer name, assignment count, and deadline
    - Handle email failures gracefully (log but don't fail assignment)
    - _Requirements: 1.6, 15.1_
  
  - [ ] 3.3 Integrate email sending into assignment service
    - Call email function after successful assignment creation
    - Batch email sending for performance
    - Log email delivery status
    - _Requirements: 1.6_

- [ ] 4. Phase Manager - Contest Phase Integration
  - [ ] 4.1 Create phase manager module
    - Create `src/lib/peer-verification/phase-manager.ts`
    - Define `initiatePeerPhase(contestId)` function
    - Define `finalizePeerPhase(contestId)` function
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_
  
  - [ ] 4.2 Implement phase initiation logic
    - Check contest phase is PEER_REVIEW
    - Verify peer_start_at and peer_end_at timestamps
    - Call assignment service to process verification requests
    - Log phase initiation with timestamp
    - _Requirements: 12.1, 12.2, 12.3_
  
  - [ ] 4.3 Create API route for phase initiation
    - Create `/api/admin/contests/[id]/initiate-peer-phase` route
    - Verify admin authentication
    - Call phase manager initiation function
    - Return success/error response
    - _Requirements: 12.1_
  
  - [ ] 4.4 Implement deadline checking cron job
    - Create `/api/cron/check-assignment-deadlines` route
    - Query assignments with deadline < NOW() and status PENDING
    - Update status to EXPIRED
    - Log expired assignments
    - _Requirements: 5.2, 12.4_
  
  - [ ] 4.5 Implement deadline warning email system
    - Create `/api/cron/send-deadline-warnings` route
    - Query assignments with deadline within 24 hours
    - Send warning emails to reviewers
    - Query assignments with deadline within 2 hours
    - Send final reminder emails
    - _Requirements: 5.3, 5.4, 15.2, 15.3_
  
  - [ ] 4.6 Configure Vercel cron jobs
    - Add cron configuration to `vercel.json`
    - Set hourly schedule for deadline checking
    - Set 6-hour schedule for warning emails
    - _Requirements: 5.2, 5.3, 5.4_

- [ ] 5. Reviewer Dashboard - UI Components
  - [ ] 5.1 Create reviewer dashboard page
    - Create `src/app/dashboard/peer-evaluations/page.tsx`
    - Implement server-side data fetching for assignments
    - Verify user authentication
    - Pass assignments data to client component
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [ ] 5.2 Create peer evaluations client component
    - Create `src/app/dashboard/peer-evaluations/PeerEvaluationsClient.tsx`
    - Display pending assignments count
    - Display completed assignments count
    - Show deadline countdown for each pending assignment
    - Implement "Start Review" button navigation
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [ ] 5.3 Create assignment card component
    - Create `src/components/peer-verification/AssignmentCard.tsx`
    - Display submission title (anonymized)
    - Display deadline with countdown timer
    - Display assignment status badge
    - Implement "Start Review" button
    - _Requirements: 3.3, 3.4_
  
  - [ ] 5.4 Add peer evaluations link to main dashboard
    - Update `src/app/dashboard/page.tsx`
    - Add "Peer Evaluation Tasks" section
    - Show pending assignment count badge
    - Add navigation link to peer evaluations page
    - _Requirements: 3.1, 3.5_
  
  - [ ] 5.5 Implement red badge indicator
    - Update user profile component
    - Query pending assignments count
    - Display red badge when count > 0
    - _Requirements: 3.5_

- [ ] 6. Reviewer Dashboard - API Routes
  - [ ] 6.1 Create assignments API route
    - Create `/api/peer-evaluations/assignments` route
    - Verify user authentication
    - Query peer_assignments for current user
    - Include related submission data (title, body_text)
    - Exclude AI screening data and author identity
    - Return assignments grouped by status (PENDING, DONE, EXPIRED)
    - _Requirements: 3.1, 3.2_
  
  - [ ] 6.2 Add security checks to assignments API
    - Verify user owns the assignments
    - Sanitize submission data (remove author info)
    - Rate limit API calls (max 60 per minute)
    - _Requirements: 4.3_

- [ ] 7. Evaluation Interface - UI Components
  - [ ] 7.1 Create evaluation page
    - Create `src/app/peer-evaluation/[assignmentId]/page.tsx`
    - Implement server-side data fetching for assignment
    - Verify user owns assignment
    - Verify assignment status is PENDING
    - Verify assignment has not expired
    - Pass assignment data to client component
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_
  
  - [ ] 7.2 Create evaluation client component
    - Create `src/app/peer-evaluation/[assignmentId]/EvaluationClient.tsx`
    - Display submission title and body text
    - Hide AI decision, scores, and author identity
    - Implement decision button state management
    - Implement comment input with character counter
    - Implement form validation
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_
  
  - [ ] 7.3 Create decision buttons component
    - Create `src/components/peer-verification/DecisionButtons.tsx`
    - Implement "Eliminate" button with destructive styling
    - Implement "Reinstate" button with success styling
    - Show selected state visually
    - _Requirements: 4.4_
  
  - [ ] 7.4 Create comment input component
    - Create `src/components/peer-verification/CommentInput.tsx`
    - Implement textarea with 100 character limit
    - Display character counter
    - Show validation error if empty
    - _Requirements: 4.5, 4.6_
  
  - [ ] 7.5 Implement evaluation submission handler
    - Create form submit handler
    - Validate decision and comment are provided
    - Call evaluation API route
    - Show loading state during submission
    - Navigate to dashboard on success
    - Show error message on failure
    - _Requirements: 4.7_

- [ ] 8. Evaluation Service - Backend Logic
  - [ ] 8.1 Create evaluation service module
    - Create `src/lib/peer-verification/evaluation-service.ts`
    - Define `submitEvaluation()` function
    - Define `validateEvaluation()` function
    - Define `checkCompletionStatus()` function
    - _Requirements: 4.7, 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [ ] 8.2 Implement evaluation validation
    - Verify user owns the assignment
    - Verify assignment status is PENDING
    - Verify assignment has not expired
    - Verify no existing peer_reviews record for assignment
    - Verify user is not the submission author
    - _Requirements: 4.7_
  
  - [ ] 8.3 Implement evaluation submission
    - Create peer_reviews record with decision and comment
    - Update peer_assignments status to DONE
    - Set completed_at timestamp
    - Log evaluation submission
    - _Requirements: 4.7_
  
  - [ ] 8.4 Implement completion status check
    - Query all peer_assignments for the submission
    - Count assignments with status DONE
    - Return true if count equals 10
    - _Requirements: 6.1, 6.2_
  
  - [ ] 8.5 Implement results trigger
    - If all 10 reviews complete, call results service
    - Pass submission_id to results calculation function
    - Handle async execution (don't block evaluation response)
    - _Requirements: 6.1, 6.2_

- [ ] 9. Evaluation Service - API Routes
  - [ ] 9.1 Create evaluation submission API route
    - Create `/api/peer-evaluations/submit` route
    - Verify user authentication
    - Parse request body (assignment_id, decision, comment)
    - Call evaluation service validation
    - Call evaluation service submission
    - Return success/error response
    - _Requirements: 4.7_
  
  - [ ] 9.2 Add anti-gaming measures
    - Implement 10-second minimum delay between submissions
    - Store last submission timestamp in session
    - Return 429 Too Many Requests if violated
    - _Requirements: 13.1_
  
  - [ ] 9.3 Add security logging
    - Log all evaluation submissions with user_id and timestamp
    - Log validation failures with reason
    - Sanitize logs to remove PII
    - _Requirements: 4.7_

- [ ] 10. Results Service - Vote Aggregation
  - [ ] 10.1 Create results service module
    - Create `src/lib/peer-verification/results-service.ts`
    - Define `calculateResults()` function
    - Define `aggregateVotes()` function
    - Define `determineOutcome()` function
    - Define TypeScript interfaces for VoteBreakdown and VerificationOutcome
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [ ] 10.2 Implement vote aggregation
    - Query all peer_reviews for the submission
    - Count ELIMINATE decisions
    - Count REINSTATE decisions
    - Calculate percentages
    - Return VoteBreakdown object
    - _Requirements: 6.1_
  
  - [ ] 10.3 Implement outcome determination
    - If reinstate_percentage >= 70, return REINSTATED outcome
    - If eliminate_percentage >= 70, return PEER_REVIEW_CONFIRMED outcome
    - If between 40-70%, return PEER_REVIEW_UPHELD outcome
    - Include decision, status, and message in outcome
    - _Requirements: 6.2, 6.3, 6.4_
  
  - [ ] 10.4 Implement submission status update
    - Update submissions table with new status based on outcome
    - Store vote breakdown in peer_verification_result jsonb column
    - Set updated_at timestamp
    - Log status change
    - _Requirements: 6.2, 6.3, 6.4, 6.5_

- [ ] 11. Results Service - Integrity Scoring
  - [ ] 11.1 Implement integrity score calculation
    - Create `calculateIntegrityDelta()` function
    - For control submissions (not verification requests):
      - Compare reviewer decision to AI decision
      - Award +10 points for match
      - Award 0 points for mismatch
    - For verification requests:
      - Compare reviewer decision to majority vote
      - Award +5 points if in majority
      - Deduct -5 points if in small minority (<30%)
      - Award 0 points if in minority but not extreme
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  
  - [ ] 11.2 Implement integrity score updates
    - Query all peer_reviews for the submission
    - For each reviewer, calculate integrity delta
    - Update users table integrity_score column
    - Log score changes
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [ ] 11.3 Implement qualified evaluator status
    - Query completed assignments count for each reviewer
    - If count >= 3, set qualified_evaluator = true
    - Send "Qualified Evaluator" email notification
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 15.5_
  
  - [ ] 11.4 Implement gaming detection
    - Query all peer_reviews for each reviewer
    - Calculate percentage of ELIMINATE vs REINSTATE decisions
    - Flag if 100% same decision (always eliminate or always reinstate)
    - Flag if >80% minority votes
    - Create flags table record with reason
    - _Requirements: 13.2, 13.3, 13.4, 13.5_

- [ ] 12. Results Service - Notifications
  - [ ] 12.1 Create verification complete email template
    - Design HTML email template matching existing style
    - Include submission code, title, and final decision
    - Include vote breakdown (e.g., "7 Reinstate, 3 Eliminate")
    - Include link to view detailed results
    - Add plain text version
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 15.4_
  
  - [ ] 12.2 Implement results notification function
    - Create `sendVerificationCompleteEmail()` in `src/lib/email.ts`
    - Use Resend API to send emails
    - Include vote breakdown and outcome
    - Handle email failures gracefully (log but don't fail results)
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  
  - [ ] 12.3 Integrate email sending into results service
    - Call email function after successful results calculation
    - Pass submission data and vote breakdown
    - Log email delivery status
    - _Requirements: 7.1_

- [ ] 13. Results Display - UI Components
  - [ ] 13.1 Create peer verification results component
    - Create `src/components/peer-verification/PeerVerificationResults.tsx`
    - Display results header with status badge
    - Display completion date
    - Show vote breakdown pie chart
    - Display final decision message
    - Show anonymized reviewer comments
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [ ] 13.2 Create vote breakdown chart component
    - Create `src/components/peer-verification/VoteBreakdownChart.tsx`
    - Implement pie chart using Recharts or similar library
    - Show Reinstate vs Eliminate percentages
    - Use color coding (green for reinstate, red for eliminate)
    - Display vote counts (e.g., "7/10")
    - _Requirements: 10.2_
  
  - [ ] 13.3 Create reviewer comments component
    - Create `src/components/peer-verification/ReviewerComments.tsx`
    - Display each comment in a card
    - Show decision (Eliminate/Reinstate) with icon
    - Anonymize reviewer identity (show as "Reviewer 1", "Reviewer 2", etc.)
    - _Requirements: 10.4_
  
  - [ ] 13.4 Integrate results into screening results page
    - Update `src/app/contest/screening-results/[submissionId]/ScreeningResultsClient.tsx`
    - Check if peer_verification_result exists
    - Render PeerVerificationResults component if results exist
    - Position after AI screening results
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 14. Email Templates - Additional Templates
  - [ ] 14.1 Create deadline warning email template
    - Design HTML email template
    - Include assignment count and deadline (24 hours)
    - Include link to reviewer dashboard
    - Add plain text version
    - _Requirements: 5.3, 15.2_
  
  - [ ] 14.2 Create final reminder email template
    - Design HTML email template
    - Include urgent messaging (2 hours remaining)
    - Include assignment count and deadline
    - Include link to reviewer dashboard
    - Add plain text version
    - _Requirements: 5.4, 15.3_
  
  - [ ] 14.3 Create qualified evaluator email template
    - Design HTML email template
    - Congratulate reviewer on earning status
    - Explain benefits of qualified evaluator status
    - Include link to dashboard
    - Add plain text version
    - _Requirements: 9.1, 9.2, 15.5_
  
  - [ ] 14.4 Implement email sending functions
    - Create `sendDeadlineWarningEmail()` in `src/lib/email.ts`
    - Create `sendFinalReminderEmail()` in `src/lib/email.ts`
    - Create `sendQualifiedEvaluatorEmail()` in `src/lib/email.ts`
    - Use Resend API for all emails
    - _Requirements: 15.2, 15.3, 15.5_

- [ ] 15. Admin Tools - Monitoring Dashboard
  - [ ] 15.1 Create admin peer verification dashboard page
    - Create `src/app/admin/peer-verification/page.tsx`
    - Verify admin authentication
    - Display all active verification requests
    - Show assignment completion rates
    - Show reviewer activity metrics
    - _Requirements: 11.1, 11.2_
  
  - [ ] 15.2 Create verification request list component
    - Create `src/components/admin/VerificationRequestList.tsx`
    - Display submission code, title, and status
    - Show completion progress (e.g., "7/10 reviews complete")
    - Show time since payment
    - Provide link to view details
    - _Requirements: 11.1_
  
  - [ ] 15.3 Create reviewer activity component
    - Create `src/components/admin/ReviewerActivity.tsx`
    - Display reviewer list with assignment counts
    - Show completion rates
    - Show integrity scores
    - Highlight flagged reviewers
    - _Requirements: 11.2_
  
  - [ ] 15.4 Create admin API routes
    - Create `/api/admin/peer-verification/requests` route
    - Create `/api/admin/peer-verification/reviewers` route
    - Verify admin authentication
    - Return aggregated data for dashboard
    - _Requirements: 11.1, 11.2_

- [ ] 16. Admin Tools - Manual Intervention
  - [ ] 16.1 Create assignment reassignment functionality
    - Create `/api/admin/peer-verification/reassign` route
    - Allow admin to reassign expired assignments
    - Select new reviewer from eligible pool
    - Create new peer_assignments record
    - Send assignment notification email
    - Log admin action in audit_logs
    - _Requirements: 11.3_
  
  - [ ] 16.2 Create results override functionality
    - Create `/api/admin/peer-verification/override` route
    - Allow admin to manually change verification outcome
    - Require written justification
    - Update submission status
    - Log admin action in audit_logs
    - Send notification email to author
    - _Requirements: 11.4, 11.5_
  
  - [ ] 16.3 Create admin override UI
    - Add "Override Result" button to admin dashboard
    - Create modal with outcome selection and justification field
    - Call override API route on submit
    - Show success/error message
    - _Requirements: 11.4_

- [ ] 17. Testing and Validation
  - [ ]* 17.1 Write unit tests for assignment service
    - Test reviewer selection algorithm with various pool sizes
    - Test submission assignment logic
    - Test edge cases (insufficient reviewers, insufficient control submissions)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  
  - [ ]* 17.2 Write unit tests for results service
    - Test vote aggregation with different vote distributions
    - Test outcome determination (70% reinstate, 70% eliminate, 40-70%)
    - Test integrity score calculation for all scenarios
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 8.1, 8.2, 8.3, 8.4_
  
  - [ ]* 17.3 Write integration tests
    - Test end-to-end assignment flow
    - Test end-to-end evaluation flow
    - Test end-to-end results flow
    - _Requirements: All_
  
  - [ ] 17.4 Perform manual testing
    - Test happy path (request → assign → evaluate → results)
    - Test expired assignment scenario
    - Test tied vote scenario
    - Test unanimous vote scenario
    - Test admin override scenario
    - _Requirements: All_
  
  - [ ] 17.5 Validate email delivery
    - Test all email templates in staging
    - Verify email formatting on multiple clients
    - Test email delivery rates
    - _Requirements: 1.6, 5.3, 5.4, 7.1, 15.1, 15.2, 15.3, 15.5_

- [ ] 18. Documentation and Deployment
  - [ ] 18.1 Update API documentation
    - Document all new API routes
    - Include request/response examples
    - Document authentication requirements
    - Document rate limits
    - _Requirements: All_
  
  - [ ] 18.2 Create admin user guide
    - Document how to initiate peer phase
    - Document how to monitor progress
    - Document how to reassign assignments
    - Document how to override results
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_
  
  - [ ] 18.3 Create reviewer user guide
    - Document how to access assignments
    - Document how to complete evaluations
    - Document integrity scoring system
    - Document qualified evaluator status
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 8.1, 8.2, 8.3, 8.4, 9.1, 9.2_
  
  - [ ] 18.4 Deploy to staging environment
    - Run database migrations
    - Deploy backend services
    - Deploy frontend components
    - Configure cron jobs
    - Test all functionality
    - _Requirements: All_
  
  - [ ] 18.5 Deploy to production
    - Schedule deployment during low-traffic window
    - Run database migrations
    - Deploy backend services
    - Deploy frontend components
    - Configure cron jobs
    - Monitor logs for errors
    - _Requirements: All_

---

## Notes

- Tasks marked with `*` are optional testing tasks that can be skipped for faster MVP delivery
- Each task includes requirement references for traceability
- Tasks should be completed in order to ensure dependencies are met
- All database changes should be tested in staging before production deployment
- Email templates should be reviewed by stakeholders before deployment
