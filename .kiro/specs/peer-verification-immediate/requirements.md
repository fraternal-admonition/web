# Requirements Document: Peer Verification System (Immediate Processing)

## Introduction

The Peer Verification System is an appeal mechanism that allows authors whose submissions were eliminated by AI screening to request human review. When an author pays $20, the system immediately assigns 10 fellow contestants to perform a blind review (without knowing the AI's decision). Based on the majority vote, the submission may be reinstated into the contest. This system operates independently of contest phases and provides fast turnaround (7-14 days).

**Key Distinction**: This is NOT the same as normal Peer Review (Phase 5 of the contest). This is a separate, paid appeal process for AI-eliminated submissions.

## Glossary

- **System**: The Peer Verification backend services and UI components
- **Author**: The contestant whose submission was eliminated and is requesting verification
- **Reviewer**: A contestant assigned to evaluate a verification request
- **Verification Request**: A submission with status PEER_VERIFICATION_PENDING that paid $20
- **Control Submission**: A submission used to test reviewer accuracy (AI-passed or AI-eliminated with accepted decision)
- **Blind Review**: Evaluation where reviewers don't know the AI's decision or the submission's verification status
- **Integrity Score**: A numerical measure of reviewer accuracy and consistency
- **Reinstate Decision**: Peer vote to overturn AI elimination (≥70% threshold)
- **Eliminate Decision**: Peer vote to confirm AI elimination (≥70% threshold)
- **Uphold Decision**: Peer vote result when consensus is unclear (40-70%)
- **Immediate Processing**: Verification starts immediately upon payment, independent of contest phase

## Requirements

### Requirement 1: Immediate Assignment Upon Payment

**User Story:** As a system administrator, I want peer verification to start immediately after payment is confirmed, so that authors receive fast turnaround without waiting for contest phase changes.

#### Acceptance Criteria

1. WHEN a payment webhook confirms purpose PEER_VERIFICATION, THE System SHALL immediately trigger the assignment service
2. THE System SHALL NOT wait for contest phase transitions to begin peer verification
3. THE System SHALL assign 10 reviewers within 5 minutes of payment confirmation
4. THE System SHALL set assignment deadline to 7 days from creation
5. THE System SHALL send notification emails to all assigned reviewers within 10 minutes

### Requirement 2: Reviewer Eligibility and Selection

**User Story:** As a contestant, I want to be eligible to review verification requests if I have an active submission, so that only engaged participants influence outcomes.

#### Acceptance Criteria

1. THE System SHALL include only users with at least one submission in status SUBMITTED or ELIMINATED in the reviewer pool
2. THE System SHALL exclude users who are banned (is_banned = true) from the reviewer pool
3. THE System SHALL exclude the verification request author from their own review
4. THE System SHALL randomly select 10 unique reviewers from the eligible pool
5. WHERE fewer than 10 eligible reviewers exist, THE System SHALL assign all available reviewers and log a warning

### Requirement 3: Control Submission Assignment

**User Story:** As a system administrator, I want each reviewer to evaluate control submissions alongside verification requests, so that I can measure reviewer accuracy and detect gaming.

#### Acceptance Criteria

1. FOR EACH reviewer assigned to a verification request, THE System SHALL assign exactly 2 additional control submissions
2. THE System SHALL assign 1 control submission with status SUBMITTED (AI-passed)
3. THE System SHALL assign 1 control submission with status ELIMINATED where author chose Option A (accepted AI decision)
4. THE System SHALL ensure reviewers cannot identify which submission is the verification request
5. THE System SHALL create peer_assignments records for all 3 submissions per reviewer

### Requirement 4: Blind Review Evaluation Interface

**User Story:** As a reviewer, I want to evaluate submissions without knowing the AI's decision or verification status, so that my judgment is unbiased.

#### Acceptance Criteria

1. WHEN a reviewer accesses an assignment, THE System SHALL display only the submission title and body text
2. THE System SHALL NOT display AI screening status, scores, or decision
3. THE System SHALL NOT display whether the submission is a verification request or control
4. THE System SHALL NOT display the author's identity or submission code
5. THE System SHALL provide two decision buttons: "Eliminate" and "Reinstate"
6. THE System SHALL provide a comment text field with maximum 100 characters
7. THE System SHALL require both a decision and comment before allowing submission

### Requirement 5: Assignment Deadline Management

**User Story:** As a reviewer, I want clear deadlines for my assignments, so that I know when I must complete my evaluations.

#### Acceptance Criteria

1. THE System SHALL set assignment deadline to exactly 7 days from assignment creation
2. THE System SHALL display a countdown timer on the reviewer dashboard
3. THE System SHALL send a warning email 24 hours before deadline
4. THE System SHALL send a final reminder email 2 hours before deadline
5. WHEN the deadline passes and assignment status is PENDING, THE System SHALL update status to EXPIRED

### Requirement 6: Expired Assignment Handling

**User Story:** As a system administrator, I want expired assignments to be automatically reassigned, so that verification requests don't get stuck waiting indefinitely.

#### Acceptance Criteria

1. WHEN an assignment expires, THE System SHALL mark it as EXPIRED
2. THE System SHALL select a new reviewer from the eligible pool
3. THE System SHALL create a new assignment with a fresh 7-day deadline
4. THE System SHALL send notification email to the new reviewer
5. WHERE a reviewer has 2 or more expired assignments, THE System SHALL exclude them from future assignments for 30 days

### Requirement 7: Results Calculation and Aggregation

**User Story:** As a submission author, I want the system to calculate peer verification results based on majority vote, so that the outcome reflects collective human judgment.

#### Acceptance Criteria

1. WHEN all 10 reviewers complete their assignments, THE System SHALL aggregate the votes within 5 minutes
2. WHERE 70% or more reviewers vote "Reinstate", THE System SHALL update submission status to REINSTATED
3. WHERE 70% or more reviewers vote "Eliminate", THE System SHALL keep submission status as ELIMINATED and set a confirmation flag
4. WHERE votes are between 40% and 70% for either decision, THE System SHALL keep submission status as ELIMINATED and set an "upheld" flag
5. THE System SHALL calculate exact vote percentages and store them in submission peer_verification_result jsonb column

### Requirement 8: Partial Results Processing

**User Story:** As a system administrator, I want the system to calculate results even if some assignments expire, so that verification requests eventually complete.

#### Acceptance Criteria

1. WHERE 8 or more reviewers complete their assignments within 14 days, THE System SHALL calculate results with available votes
2. WHERE fewer than 8 reviewers complete within 14 days, THE System SHALL mark the verification as INCOMPLETE
3. WHERE verification is INCOMPLETE, THE System SHALL refund the $20 to the author
4. THE System SHALL send an explanation email when refunding due to insufficient reviewers
5. THE System SHALL log all partial result scenarios for admin review

### Requirement 9: Reinstated Submission Handling

**User Story:** As a submission author, I want my reinstated submission to re-enter the contest at the current phase, so that I don't miss opportunities.

#### Acceptance Criteria

1. WHEN a submission is REINSTATED, THE System SHALL check the current contest phase
2. WHERE the contest is in AI_FILTERING phase, THE System SHALL set submission status to SUBMITTED
3. WHERE the contest is in PEER_REVIEW phase, THE System SHALL make the submission eligible for peer review assignments
4. WHERE the contest is in PUBLIC_VOTING phase, THE System SHALL include the submission in the finalist pool if it meets score thresholds
5. THE System SHALL send an email to the author explaining which phase their submission has entered

### Requirement 10: Results Notification

**User Story:** As a submission author, I want to receive an email when peer verification is complete, so that I know the outcome immediately.

#### Acceptance Criteria

1. WHEN peer verification results are finalized, THE System SHALL send an email to the author within 10 minutes
2. THE email SHALL include the submission code, title, and final decision
3. THE email SHALL include vote breakdown (e.g., "7 reviewers voted Reinstate, 3 voted Eliminate")
4. THE email SHALL include a link to view detailed results on the website
5. WHERE the decision is "Reinstated", THE email SHALL explain which contest phase the submission has entered

### Requirement 11: Reviewer Integrity Scoring

**User Story:** As a system administrator, I want to track reviewer accuracy on control submissions, so that I can identify high-quality reviewers and potential gaming.

#### Acceptance Criteria

1. WHEN a reviewer evaluates a control submission (AI-passed or accepted elimination), THE System SHALL compare their decision to the AI decision
2. WHERE the reviewer matches the AI decision on a control submission, THE System SHALL award 10 integrity points
3. WHERE the reviewer contradicts the AI decision on a control submission, THE System SHALL deduct 5 integrity points
4. WHERE the reviewer matches the majority opinion on a verification request, THE System SHALL award 5 integrity points
5. WHERE the reviewer's decision falls in the minority (less than 30%), THE System SHALL deduct 3 integrity points
6. THE System SHALL store cumulative integrity scores in users.integrity_score column
7. WHERE a reviewer's integrity score falls below -20, THE System SHALL flag their account for admin review

### Requirement 12: Qualified Evaluator Status

**User Story:** As a reviewer, I want to earn recognition for completing evaluations accurately, so that I build reputation in the community.

#### Acceptance Criteria

1. WHEN a reviewer completes 3 assignments with status DONE, THE System SHALL grant "Qualified Evaluator" status
2. THE System SHALL set users.qualified_evaluator to true
3. THE System SHALL display a "Qualified Evaluator" badge on the reviewer's profile
4. THE System SHALL send a congratulatory email when status is granted
5. WHERE a Qualified Evaluator's integrity score drops below 0, THE System SHALL revoke the status

### Requirement 13: Results Display on Screening Results Page

**User Story:** As a submission author, I want to see peer verification results on my screening results page, so that I understand how my peers evaluated my work.

#### Acceptance Criteria

1. WHEN peer verification is complete, THE System SHALL display a "Peer Verification Results" section on the screening results page
2. THE System SHALL display a pie chart or bar chart showing vote distribution
3. THE System SHALL display the final decision (Reinstated, Eliminated Confirmed, or AI Decision Upheld)
4. THE System SHALL display anonymized reviewer comments (without reviewer identities)
5. THE System SHALL display the date when verification was completed

### Requirement 14: Anti-Gaming Measures

**User Story:** As a system administrator, I want to prevent reviewers from gaming the system, so that peer verification results are trustworthy.

#### Acceptance Criteria

1. THE System SHALL enforce a minimum 10-second delay between submitting evaluations
2. THE System SHALL detect and flag reviewers who always vote the same way (100% Eliminate or 100% Reinstate across 5+ assignments)
3. THE System SHALL detect and flag reviewers whose decisions deviate significantly from the majority (>80% minority votes across 5+ assignments)
4. WHERE suspicious patterns are detected, THE System SHALL flag the reviewer account in the flags table
5. THE System SHALL exclude flagged reviewers from future assignment pools until admin review

### Requirement 15: Reviewer Dashboard

**User Story:** As a reviewer, I want to see my assigned verification tasks in my dashboard, so that I know what I need to review and by when.

#### Acceptance Criteria

1. WHEN a reviewer visits the dashboard, THE System SHALL display a "Peer Verification Tasks" section if assignments exist
2. THE System SHALL show the count of pending, completed, and expired assignments
3. THE System SHALL display a deadline countdown for each pending assignment
4. THE System SHALL provide a "Start Review" button for each pending assignment
5. THE System SHALL show a red badge indicator on the user profile when pending assignments exist

### Requirement 16: Admin Monitoring Dashboard

**User Story:** As a system administrator, I want to monitor peer verification progress, so that I can identify and resolve issues quickly.

#### Acceptance Criteria

1. THE System SHALL provide an admin dashboard showing all active verification requests
2. THE System SHALL display assignment completion rates for each verification request
3. THE System SHALL show reviewer activity metrics (completion rate, average time, integrity score)
4. THE System SHALL highlight verification requests with expired assignments
5. THE System SHALL allow admins to manually reassign expired assignments

### Requirement 17: Admin Override Capability

**User Story:** As a system administrator, I want to manually override verification results in exceptional cases, so that I can handle edge cases and disputes.

#### Acceptance Criteria

1. THE System SHALL allow admins to manually change verification outcomes
2. THE System SHALL require a written justification for any override
3. THE System SHALL log all admin overrides in the audit_logs table
4. THE System SHALL send notification emails to authors when results are overridden
5. THE System SHALL display override information on the results page

### Requirement 18: Database Schema Support

**User Story:** As a developer, I want the database schema to support all peer verification features, so that data integrity is maintained.

#### Acceptance Criteria

1. THE System SHALL use peer_assignments.deadline column to track assignment expiration
2. THE System SHALL use peer_reviews.decision column with values ELIMINATE or REINSTATE
3. THE System SHALL use submissions.peer_verification_result jsonb column to store vote breakdown
4. THE System SHALL use users.integrity_score integer column to track reviewer accuracy
5. THE System SHALL use users.qualified_evaluator boolean column to track reviewer status
6. THE System SHALL use submission status values: PEER_VERIFICATION_PENDING, REINSTATED

### Requirement 19: Email Template Requirements

**User Story:** As a user, I want to receive clear, professional emails about peer verification, so that I understand my responsibilities and outcomes.

#### Acceptance Criteria

1. THE System SHALL send "Assignment Notification" emails to reviewers with assignment details and deadline
2. THE System SHALL send "Deadline Warning" emails 24 hours before assignment expiration
3. THE System SHALL send "Final Reminder" emails 2 hours before assignment expiration
4. THE System SHALL send "Verification Complete" emails to authors with results and vote breakdown
5. THE System SHALL send "Qualified Evaluator" emails when reviewers earn the status
6. THE System SHALL send "Refund Notification" emails when verification is incomplete

### Requirement 20: Performance and Scalability

**User Story:** As a system administrator, I want the peer verification system to handle high volumes efficiently, so that it scales with contest growth.

#### Acceptance Criteria

1. THE System SHALL process payment webhooks and trigger assignments within 5 minutes
2. THE System SHALL handle 100 concurrent verification requests without performance degradation
3. THE System SHALL calculate results for a verification request within 5 minutes of the last review
4. THE System SHALL send notification emails asynchronously to avoid blocking operations
5. THE System SHALL use database indexes on peer_assignments(reviewer_user_id, status) and peer_assignments(submission_id, status)
