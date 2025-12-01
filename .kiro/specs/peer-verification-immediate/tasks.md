# Implementation Plan: Peer Verification System (Immediate Processing)

## Overview

This implementation plan breaks down the Peer Verification System with immediate processing into discrete, manageable coding tasks. The system triggers immediately upon payment without waiting for contest phase transitions, providing fast turnaround for authors appealing AI elimination decisions.

---

## Task List

- [x] 1. Webhook Integration for Immediate Trigger


  - Modify Stripe webhook handler to call immediate assignment service
  - Add error handling and retry logic for assignment failures
  - Add logging for webhook processing time
  - Test webhook with test payment in Stripe
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Immediate Assignment Service - Core Logic



  - [x] 2.1 Create immediate assignment service module


    - Create `src/lib/peer-verification/immediate-assignment-service.ts`
    - Define TypeScript interfaces for Assignment, Reviewer, VerificationRequest
    - Export main `executeImmediateAssignment(submissionId)` function
    - _Requirements: 1.1, 1.2_

  
  - [x] 2.2 Implement eligible reviewer query


    - Query users with at least one submission in the contest
    - Exclude banned users (is_banned = true)
    - Exclude the verification request author
    - Return list of eligible reviewers
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [x] 2.3 Implement random reviewer selection


    - Shuffle eligible reviewers randomly
    - Select first 10 (or all if fewer available)
    - Log warning if fewer than 10 reviewers

    - _Requirements: 2.4, 2.5_

  

  - [x] 2.4 Implement control submission selection
    - Query 10 AI-passed submissions (status = SUBMITTED)

    - Query 10 AI-eliminated submissions where author chose Option A
    - Randomly select 1 of each type per reviewer

    - Handle edge case: insufficient control submissions
    - _Requirements: 3.1, 3.2, 3.3_

  
  - [x] 2.5 Implement assignment creation
    - For each reviewer, create 3 peer_assignments records:
      - 1 for verification request

      - 1 for AI-passed control
      - 1 for AI-eliminated control
    - Set status = PENDING

    - Set deadline = now + 7 days
    - Set assigned_at = now
    - Randomize order so reviewer can't identify which is which

    - _Requirements: 3.4, 3.5, 5.1_
  
  - [x] 2.6 Add transaction handling and error recovery
    - Wrap assignment logic in database transaction
    - Implement rollback on failure
    - Add retry logic (up to 3 attempts)
    - Log errors with sanitized data
    - _Requirements: 1.1, 1.5_

- [x] 3. Assignment Service - Email Notifications



  - [x] 3.1 Create assignment notification email template


    - Design HTML email template matching existing style
    - Include assignment count (3), deadline, and call-to-action button
    - Include link to reviewer dashboard
    - Add plain text version
    - _Requirements: 1.5, 19.1_
  
  - [x] 3.2 Implement email sending function

    - Create `sendAssignmentNotificationEmail()` in `src/lib/email.ts`
    - Use Resend API to send emails
    - Include reviewer name, assignment count, and deadline
    - Handle email failures gracefully (log but don't fail assignment)
    - _Requirements: 1.5, 19.1_
  
  - [x] 3.3 Integrate email sending into assignment service


    - Call email function after successful assignment creation
    - Send emails asynchronously to avoid blocking
    - Log email delivery status
    - _Requirements: 1.5_

- [x] 4. Reviewer Dashboard - UI Components


  - [x] 4.1 Create reviewer dashboard page


    - Create `src/app/dashboard/peer-verification-tasks/page.tsx`
    - Implement server-side data fetching for assignments
    - Verify user authentication
    - Pass assignments data to client component
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_
  
  - [x] 4.2 Create peer verification tasks client component

    - Create `src/app/dashboard/peer-verification-tasks/PeerVerificationTasksClient.tsx`
    - Display pending assignments count
    - Display completed assignments count
    - Display expired assignments count
    - Show deadline countdown for each pending assignment
    - Implement "Start Review" button navigation
    - _Requirements: 15.1, 15.2, 15.3, 15.4_
  
  - [x] 4.3 Create assignment card component


    - Create `src/components/peer-verification/AssignmentCard.tsx`
    - Display assignment number (1 of 3, 2 of 3, 3 of 3)
    - Display deadline with countdown timer
    - Display assignment status badge
    - Implement "Start Review" button
    - _Requirements: 15.3, 15.4_
  
  - [x] 4.4 Create integrity score card component

    - Create `src/components/peer-verification/IntegrityScoreCard.tsx`
    - Display current integrity score
    - Display Qualified Evaluator badge if applicable
    - Show explanation of integrity scoring
    - _Requirements: 11.6, 12.2, 12.3_
  
  - [x] 4.5 Add peer verification tasks link to main dashboard


    - Update `src/app/dashboard/page.tsx`
    - Add "Peer Verification Tasks" section
    - Show pending assignment count badge
    - Add navigation link to peer verification tasks page
    - _Requirements: 15.1, 15.5_
  
  - [x] 4.6 Implement red badge indicator

    - Update user profile component
    - Query pending assignments count
    - Display red badge when count > 0
    - _Requirements: 15.5_

- [x] 5. Reviewer Dashboard - API Routes


  - [x] 5.1 Create assignments API route


    - Create `/api/peer-verification/assignments` route
    - Verify user authentication
    - Query peer_assignments for current user
    - Include related submission data (title, body_text)
    - Exclude AI screening data and author identity
    - Return assignments grouped by status (PENDING, DONE, EXPIRED)
    - _Requirements: 15.1, 15.2_
  
  - [x] 5.2 Add security checks to assignments API

    - Verify user owns the assignments
    - Sanitize submission data (remove author info, AI decision)
    - Rate limit API calls (max 60 per minute)
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 6. Blind Evaluation Interface - UI Components
  - [x] 6.1 Create evaluation page


    - Create `src/app/peer-verification/review/[assignmentId]/page.tsx`
    - Implement server-side data fetching for assignment
    - Verify user owns assignment
    - Verify assignment status is PENDING
    - Verify assignment has not expired
    - Pass assignment data to client component
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_
  
  - [x] 6.2 Create evaluation client component


    - Create `src/app/peer-verification/review/[assignmentId]/EvaluationClient.tsx`
    - Display submission title and body text
    - Hide AI decision, scores, status, and author identity
    - Display blind review notice
    - Implement decision button state management
    - Implement comment input with character counter
    - Implement form validation
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_
  
  - [x] 6.3 Create decision buttons component



    - Create `src/components/peer-verification/DecisionButtons.tsx`
    - Implement "Eliminate" button with destructive styling
    - Implement "Reinstate" button with success styling
    - Show selected state visually
    - Add icons (XCircle, CheckCircle)
    - _Requirements: 4.4_
  
  - [x] 6.4 Create comment input component


    - Create `src/components/peer-verification/CommentInput.tsx`
    - Implement textarea with 100 character limit
    - Display character counter
    - Show validation error if empty
    - _Requirements: 4.5, 4.6_
  
  - [x] 6.5 Implement evaluation submission handler



    - Create form submit handler
    - Validate decision and comment are provided
    - Enforce 10-second delay since last submission (client-side)
    - Call evaluation API route
    - Show loading state during submission
    - Navigate to next assignment or dashboard on success
    - Show error message on failure
    - _Requirements: 4.7, 14.1_

- [ ] 7. Evaluation Service - Backend Logic
  - [x] 7.1 Create evaluation service module


    - Create `src/lib/peer-verification/evaluation-service.ts`
    - Define `submitEvaluation()` function
    - Define `validateEvaluation()` function
    - Define `checkVerificationCompletion()` function
    - _Requirements: 4.7_
  
  - [x] 7.2 Implement evaluation validation


    - Verify user owns the assignment
    - Verify assignment status is PENDING
    - Verify assignment has not expired
    - Verify no existing peer_reviews record for assignment
    - Verify user is not the submission author
    - _Requirements: 4.7_
  
  - [x] 7.3 Implement evaluation submission



    - Create peer_reviews record with decision and comment
    - Update peer_assignments status to DONE
    - Set completed_at timestamp
    - Log evaluation submission
    - _Requirements: 4.7_
  
  - [x] 7.4 Implement completion status check


    - Query all peer_assignments for the verification request submission
    - Count assignments with status DONE
    - Return true if count equals 10
    - Return completion percentage
    - _Requirements: 7.1_
  
  - [x] 7.5 Implement results trigger



    - If all 10 reviews complete, call results service asynchronously
    - Pass submission_id to results calculation function
    - Handle async execution (don't block evaluation response)
    - _Requirements: 7.1_

- [ ] 8. Evaluation Service - API Routes
  - [x] 8.1 Create evaluation submission API route


    - Create `/api/peer-verification/submit` route
    - Verify user authentication
    - Parse request body (assignment_id, decision, comment)
    - Call evaluation service validation
    - Call evaluation service submission
    - Return success/error response with completion status
    - _Requirements: 4.7_
  
  - [x] 8.2 Add rate limiting


    - Implement 10-second minimum delay between submissions
    - Store last submission timestamp in Redis or database
    - Return 429 Too Many Requests if violated
    - _Requirements: 14.1_
  

  - [x] 8.3 Add security logging


    - Log all evaluation submissions with user_id and timestamp
    - Log validation failures with reason
    - Sanitize logs to remove PII
    - _Requirements: 4.7_

- [ ] 9. Results Service - Vote Aggregation
  - [x] 9.1 Create results service module


    - Create `src/lib/peer-verification/results-service.ts`
    - Define `calculateResults()` function
    - Define `aggregateVotes()` function
    - Define `determineOutcome()` function
    - Define TypeScript interfaces for VoteBreakdown and VerificationOutcome
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [x] 9.2 Implement vote aggregation

    - Query all peer_reviews for the verification request submission
    - Count ELIMINATE decisions
    - Count REINSTATE decisions
    - Calculate percentages
    - Return VoteBreakdown object
    - _Requirements: 7.1_
  
  - [x] 9.3 Implement outcome determination

    - If reinstate_percentage >= 70, return REINSTATED outcome
    - If eliminate_percentage >= 70, return ELIMINATED_CONFIRMED outcome
    - If between 40-70%, return AI_DECISION_UPHELD outcome
    - Include decision, newStatus, and message in outcome
    - _Requirements: 7.2, 7.3, 7.4_
  
  - [x] 9.4 Implement submission status update

    - Update submissions table with new status based on outcome
    - Store vote breakdown in peer_verification_result jsonb column
    - Set updated_at timestamp
    - Log status change
    - _Requirements: 7.2, 7.3, 7.4, 7.5_
  
  - [x] 9.5 Implement reinstated submission phase handling


    - Check current contest phase
    - If AI_FILTERING: set status to SUBMITTED
    - If PEER_REVIEW: make eligible for peer review assignments
    - If PUBLIC_VOTING: include in finalist pool if meets thresholds
    - Log which phase submission entered
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 10. Results Service - Integrity Scoring
  - [x] 10.1 Implement integrity score calculation


    - Create `calculateIntegrityDelta()` function
    - For control submissions (not verification requests):
      - Compare reviewer decision to AI decision
      - Award +10 points for match
      - Deduct -5 points for mismatch
    - For verification requests:
      - Compare reviewer decision to majority vote
      - Award +5 points if in majority
      - Deduct -3 points if in small minority (<30%)
      - Award 0 points if in minority but not extreme
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_
  
  - [x] 10.2 Implement integrity score updates

    - Query all peer_reviews for the verification request
    - For each reviewer, calculate integrity delta
    - Update users table integrity_score column
    - Log score changes
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_
  
  - [x] 10.3 Implement qualified evaluator status check

    - Query completed assignments count for each reviewer
    - If count >= 3 and integrity_score >= 0, set qualified_evaluator = true
    - Send "Qualified Evaluator" email notification
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_
  
  - [x] 10.4 Implement gaming detection



    - Query all peer_reviews for each reviewer
    - Calculate percentage of ELIMINATE vs REINSTATE decisions
    - Flag if 100% same decision across 5+ assignments
    - Flag if >80% minority votes across 5+ assignments
    - Create flags table record with reason
    - _Requirements: 14.2, 14.3, 14.4, 14.5_

- [ ] 11. Results Service - Notifications
  - [x] 11.1 Create verification complete email template


    - Design HTML email template matching existing style
    - Include submission code, title, and final decision
    - Include vote breakdown (e.g., "7 Reinstate, 3 Eliminate")
    - Include link to view detailed results
    - Explain which phase submission entered if reinstated
    - Add plain text version
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 19.4_
  
  - [x] 11.2 Implement results notification function


    - Create `sendVerificationCompleteEmail()` in `src/lib/email.ts`
    - Use Resend API to send emails
    - Include vote breakdown and outcome
    - Include phase information if reinstated
    - Handle email failures gracefully (log but don't fail results)
    - _Requirements: 10.1, 10.2, 10.3, 10.4_
  
  - [x] 11.3 Integrate email sending into results service


    - Call email function after successful results calculation
    - Pass submission data, vote breakdown, and outcome
    - Send asynchronously
    - Log email delivery status
    - _Requirements: 10.1_

- [ ] 12. Results Display - UI Components
  - [x] 12.1 Create peer verification results component


    - Create `src/components/peer-verification/PeerVerificationResults.tsx`
    - Display results header with status badge
    - Display completion date
    - Show vote breakdown chart
    - Display final decision message
    - Show anonymized reviewer comments
    - Show which phase submission entered if reinstated
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_
  
  - [x] 12.2 Create vote breakdown chart component

    - Create `src/components/peer-verification/VoteBreakdownChart.tsx`
    - Implement pie chart using Recharts or similar library
    - Show Reinstate vs Eliminate percentages
    - Use color coding (green for reinstate, red for eliminate)
    - Display vote counts (e.g., "7/10")
    - _Requirements: 13.2_
  
  - [x] 12.3 Create reviewer comments component

    - Create `src/components/peer-verification/ReviewerComments.tsx`
    - Display each comment in a card
    - Show decision (Eliminate/Reinstate) with icon
    - Anonymize reviewer identity (show as "Reviewer 1", "Reviewer 2", etc.)
    - _Requirements: 13.4_
  
  - [x] 12.4 Integrate results into screening results page



    - Update `src/app/contest/screening-results/[submissionId]/ScreeningResultsClient.tsx`
    - Check if peer_verification_result exists in submission
    - Render PeerVerificationResults component if results exist
    - Position after AI screening results
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ] 13. Deadline Management Service
  - [x] 13.1 Create deadline management service module


    - Create `src/lib/peer-verification/deadline-service.ts`
    - Define `checkExpiredAssignments()` function
    - Define `reassignExpiredAssignments()` function
    - Define `sendDeadlineWarnings()` function
    - Define `sendFinalReminders()` function
    - _Requirements: 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.4, 6.5_
  

  - [ ] 13.2 Implement expired assignment detection
    - Query assignments with deadline < NOW() and status PENDING
    - Update status to EXPIRED
    - Log expired assignments
    - _Requirements: 5.5, 6.1_

  
  - [ ] 13.3 Implement assignment reassignment
    - For each expired assignment, select a new reviewer
    - Exclude reviewers with 2+ expired assignments
    - Create new assignment with fresh 7-day deadline
    - Send notification email to new reviewer

    - _Requirements: 6.2, 6.3, 6.4, 6.5_
  
  - [ ] 13.4 Implement deadline warning emails
    - Query assignments with deadline within 24 hours
    - Send warning emails to reviewers

    - Mark as warned to avoid duplicate emails
    - _Requirements: 5.3, 19.2_
  
  - [ ] 13.5 Implement final reminder emails
    - Query assignments with deadline within 2 hours
    - Send final reminder emails to reviewers


    - Mark as reminded to avoid duplicate emails
    - _Requirements: 5.4, 19.3_

- [ ] 14. Deadline Management - Cron Jobs
  - [x] 14.1 Create deadline checking cron route


    - Create `/api/cron/peer-verification/check-deadlines` route
    - Call deadline service to check and mark expired assignments
    - Call deadline service to reassign expired assignments
    - Return summary of actions taken
    - _Requirements: 5.5, 6.1, 6.2, 6.3, 6.4_



  
  - [ ] 14.2 Create deadline warnings cron route
    - Create `/api/cron/peer-verification/send-warnings` route
    - Call deadline service to send 24h warnings
    - Call deadline service to send 2h reminders
    - Return summary of emails sent
    - _Requirements: 5.3, 5.4_
  
  - [ ] 14.3 Configure Vercel cron jobs
    - Add cron configuration to `vercel.json`
    - Set hourly schedule for deadline checking
    - Set 6-hour schedule for warning emails
    - _Requirements: 5.2, 5.3, 5.4_

- [ ] 15. Incomplete Verification Handling
  - [ ] 15.1 Implement incomplete verification detection
    - Create `checkIncompleteVerifications()` function
    - Query verification requests older than 14 days
    - Check if fewer than 8 reviews completed
    - Mark as INCOMPLETE
    - _Requirements: 8.1, 8.2, 8.3_
  
  - [ ] 15.2 Implement refund processing
    - Create `processRefund()` function
    - Update payment status to REFUNDED
    - Create Stripe refund via API
    - Send refund notification email to author
    - _Requirements: 8.3, 8.4, 19.6_
  
  - [ ] 15.3 Create incomplete verification cron route
    - Create `/api/cron/peer-verification/check-incomplete` route
    - Call deadline service to check incomplete verifications
    - Process refunds for incomplete verifications
    - Return summary of refunds processed
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  
  - [ ] 15.4 Add incomplete verification cron to Vercel config
    - Update `vercel.json` with daily cron job
    - Set to run at midnight
    - _Requirements: 8.1, 8.2_

- [ ] 16. Email Templates - Additional Templates
  - [ ] 16.1 Create deadline warning email template
    - Design HTML email template
    - Include assignment count and deadline (24 hours)
    - Include link to reviewer dashboard
    - Add plain text version
    - _Requirements: 5.3, 19.2_
  
  - [ ] 16.2 Create final reminder email template
    - Design HTML email template
    - Include urgent messaging (2 hours remaining)
    - Include assignment count and deadline
    - Include link to reviewer dashboard
    - Add plain text version
    - _Requirements: 5.4, 19.3_
  
  - [ ] 16.3 Create qualified evaluator email template
    - Design HTML email template
    - Congratulate reviewer on earning status
    - Explain benefits of qualified evaluator status
    - Include link to dashboard
    - Add plain text version
    - _Requirements: 12.1, 12.2, 19.5_
  
  - [ ] 16.4 Create refund notification email template
    - Design HTML email template
    - Explain why refund was issued (insufficient reviewers)
    - Include refund amount and timeline
    - Apologize for inconvenience
    - Add plain text version
    - _Requirements: 8.4, 19.6_
  
  - [ ] 16.5 Implement email sending functions
    - Create `sendDeadlineWarningEmail()` in `src/lib/email.ts`
    - Create `sendFinalReminderEmail()` in `src/lib/email.ts`
    - Create `sendQualifiedEvaluatorEmail()` in `src/lib/email.ts`
    - Create `sendRefundNotificationEmail()` in `src/lib/email.ts`
    - Use Resend API for all emails
    - _Requirements: 19.2, 19.3, 19.5, 19.6_

- [x] 17. Admin Tools - Monitoring Dashboard


  - [x] 17.1 Create admin peer verification dashboard page


    - Create `src/app/admin/peer-verification/page.tsx`
    - Verify admin authentication
    - Display all active verification requests
    - Show assignment completion rates
    - Show reviewer activity metrics
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_
  
  - [x] 17.2 Create verification request list component


    - Create `src/components/admin/VerificationRequestList.tsx`
    - Display submission code, title, and status
    - Show completion progress (e.g., "7/10 reviews complete")
    - Show time since payment
    - Provide link to view details
    - _Requirements: 16.1_
  
  - [x] 17.3 Create reviewer activity component


    - Create `src/components/admin/ReviewerActivity.tsx`
    - Display reviewer list with assignment counts
    - Show completion rates
    - Show integrity scores
    - Highlight flagged reviewers
    - _Requirements: 16.2_
  
  - [x] 17.4 Create admin API routes


    - Create `/api/admin/peer-verification/requests` route
    - Create `/api/admin/peer-verification/reviewers` route
    - Verify admin authentication
    - Return aggregated data for dashboard
    - _Requirements: 16.1, 16.2_

- [x] 18. Admin Tools - Manual Intervention



  - [x] 18.1 Create assignment reassignment functionality


    - Create `/api/admin/peer-verification/reassign` route
    - Allow admin to manually reassign expired assignments
    - Select new reviewer from eligible pool
    - Create new peer_assignments record
    - Send assignment notification email
    - Log admin action in audit_logs
    - _Requirements: 16.3_
  
  - [x] 18.2 Create results override functionality


    - Create `/api/admin/peer-verification/override` route
    - Allow admin to manually change verification outcome
    - Require written justification
    - Update submission status
    - Log admin action in audit_logs
    - Send notification email to author
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_
  
  - [x] 18.3 Create admin override UI


    - Add "Override Result" button to admin dashboard
    - Create modal with outcome selection and justification field
    - Call override API route on submit
    - Show success/error message
    - _Requirements: 17.1, 17.2_

- [ ] 19. Testing and Validation
  - [ ]* 19.1 Write unit tests for immediate assignment service
    - Test reviewer selection with various pool sizes
    - Test control submission selection
    - Test assignment creation logic
    - Test edge cases (insufficient reviewers, insufficient controls)
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3_
  
  - [ ]* 19.2 Write unit tests for results service
    - Test vote aggregation with different vote distributions
    - Test outcome determination (70% reinstate, 70% eliminate, 40-70%)
    - Test integrity score calculation for all scenarios
    - Test phase handling for reinstated submissions
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 9.1, 9.2, 9.3, 9.4, 9.5, 11.1, 11.2, 11.3, 11.4, 11.5_
  
  - [ ]* 19.3 Write integration tests
    - Test end-to-end immediate assignment flow
    - Test end-to-end evaluation flow
    - Test end-to-end results flow
    - Test deadline expiration and reassignment
    - Test incomplete verification and refund
    - _Requirements: All_
  
  - [ ] 19.4 Perform manual testing
    - Test with real payment in staging
    - Verify immediate assignment works (within 5 minutes)
    - Test full flow end-to-end
    - Test expired assignment scenario
    - Test tied vote scenario
    - Test unanimous vote scenario
    - Test admin override scenario
    - Test incomplete verification refund
    - _Requirements: All_
  
  - [ ] 19.5 Validate email delivery
    - Test all email templates in staging
    - Verify email formatting on multiple clients
    - Test email delivery rates
    - Verify all links work correctly
    - _Requirements: 1.5, 5.3, 5.4, 10.1, 19.1, 19.2, 19.3, 19.4, 19.5, 19.6_

- [ ] 20. Documentation and Deployment
  - [ ] 20.1 Update API documentation
    - Document all new API routes
    - Include request/response examples
    - Document authentication requirements
    - Document rate limits
    - _Requirements: All_
  
  - [ ] 20.2 Create admin user guide
    - Document how immediate processing works
    - Document how to monitor verification progress
    - Document how to reassign assignments
    - Document how to override results
    - Document how refunds are processed
    - _Requirements: 16.1, 16.2, 16.3, 17.1, 17.2_
  
  - [ ] 20.3 Create reviewer user guide
    - Document how to access assignments
    - Document how to complete evaluations
    - Document integrity scoring system
    - Document qualified evaluator status
    - Document deadlines and consequences
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 11.1, 11.2, 11.3, 11.4, 11.5, 12.1, 12.2_
  
  - [ ] 20.4 Deploy to staging environment
    - Run database migrations (if any new columns needed)
    - Deploy backend services
    - Deploy frontend components
    - Configure cron jobs
    - Test all functionality
    - _Requirements: All_
  
  - [ ] 20.5 Deploy to production
    - Schedule deployment during low-traffic window
    - Deploy backend services
    - Deploy frontend components
    - Configure cron jobs
    - Monitor logs for errors
    - Test with real payment
    - _Requirements: All_

---

## Notes

- Tasks marked with `*` are optional testing tasks that can be skipped for faster MVP delivery
- Each task includes requirement references for traceability
- Tasks should be completed in order to ensure dependencies are met
- The immediate processing approach means no waiting for contest phase transitions
- All assignments trigger within 5 minutes of payment confirmation
- Reviewers have 7 days to complete assignments
- System handles expired assignments automatically with reassignment
- Incomplete verifications (>14 days, <8 reviews) trigger automatic refunds
- All email templates should match existing project style
- Admin tools provide full visibility and manual override capability

---

## Key Differences from Phase-Based Approach

1. **Immediate Trigger**: Assignment happens in webhook, not in phase manager
2. **No Phase Dependency**: Works during any contest phase
3. **Fast Turnaround**: 7-14 days instead of waiting for phase transitions
4. **Independent Timeline**: Each verification has its own 7-day deadline
5. **Automatic Refunds**: System refunds if insufficient reviewers complete within 14 days
6. **Phase Re-entry**: Reinstated submissions enter current contest phase, not a specific phase
