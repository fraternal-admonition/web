# Requirements Document: Peer Verification System

## Introduction

The Peer Verification System is the core execution engine for the peer review process in the Fraternal Admonition contest. After a user pays $20 to request peer verification of an AI elimination decision, this system orchestrates the entire review workflow: assigning reviewers, collecting evaluations, calculating results, and notifying participants. This system ensures fairness, transparency, and human oversight in the AI-driven contest process.

## Glossary

- **System**: The Peer Verification System backend services and UI components
- **Reviewer**: A contestant who evaluates submissions as part of peer verification
- **Assignment**: A single submission assigned to a reviewer for evaluation
- **Verification Request**: A submission that has paid for peer verification review
- **Control Submission**: A submission used to calibrate reviewer accuracy (not requesting verification)
- **Integrity Score**: A numerical measure of reviewer accuracy and consistency
- **Peer Phase**: The contest phase when peer verification reviews are conducted
- **Blind Review**: Evaluation where reviewers don't know the AI's decision
- **Reinstate Decision**: Peer vote to overturn AI elimination and advance submission
- **Eliminate Decision**: Peer vote to confirm AI elimination
- **Uphold Decision**: Peer vote result when consensus is unclear (40-70%)

## Requirements

### Requirement 1: Automatic Reviewer Assignment

**User Story:** As a contest administrator, I want the system to automatically assign reviewers to verification requests when the peer phase begins, so that the review process starts without manual intervention.

#### Acceptance Criteria

1. WHEN the contest phase transitions to PEER_REVIEW, THE System SHALL identify all submissions with status PEER_VERIFICATION_PENDING
2. FOR EACH verification request, THE System SHALL assign exactly 10 unique reviewers from eligible contestants
3. FOR EACH reviewer, THE System SHALL assign exactly 3 submissions: one verification request, one accepted elimination, and one AI-passed submission
4. THE System SHALL ensure no reviewer evaluates their own submission
5. THE System SHALL create peer_assignments records with status PENDING for all assignments
6. THE System SHALL send email notifications to all assigned reviewers within 5 minutes of assignment

### Requirement 2: Reviewer Eligibility and Selection

**User Story:** As a contestant, I want to be eligible to review submissions if I have submitted my own letter, so that only active participants can influence peer verification outcomes.

#### Acceptance Criteria

1. THE System SHALL include only users with at least one submission in status SUBMITTED or ELIMINATED in the reviewer pool
2. THE System SHALL exclude users who are banned (is_banned = true) from the reviewer pool
3. THE System SHALL distribute assignments evenly across eligible reviewers to prevent overloading
4. THE System SHALL prioritize reviewers who have completed previous assignments successfully
5. WHERE a reviewer has insufficient eligible contestants, THE System SHALL log a warning and assign available reviewers

### Requirement 3: Reviewer Dashboard and Task Display

**User Story:** As a reviewer, I want to see my assigned evaluation tasks in my dashboard, so that I know which submissions I need to review and by when.

#### Acceptance Criteria

1. WHEN a reviewer visits the dashboard, THE System SHALL display a "Peer Evaluation Tasks" section if assignments exist
2. THE System SHALL show the count of pending, completed, and expired assignments
3. THE System SHALL display a deadline countdown for each pending assignment
4. THE System SHALL provide a "Start Review" button for each pending assignment
5. THE System SHALL show a red badge indicator on the user profile when pending assignments exist

### Requirement 4: Blind Review Evaluation Interface

**User Story:** As a reviewer, I want to evaluate a submission without knowing the AI's decision, so that my judgment is unbiased and fair.

#### Acceptance Criteria

1. WHEN a reviewer clicks "Start Review", THE System SHALL display the submission title and body text
2. THE System SHALL NOT display the AI screening status, scores, or decision
3. THE System SHALL NOT display the author's identity or submission code
4. THE System SHALL provide two decision buttons: "Eliminate" and "Reinstate"
5. THE System SHALL provide a comment text field with maximum 100 characters
6. THE System SHALL require both a decision and comment before allowing submission
7. WHEN the reviewer submits their evaluation, THE System SHALL create a peer_reviews record and update assignment status to DONE

### Requirement 5: Assignment Deadline Enforcement

**User Story:** As a contest administrator, I want assignments to expire after a deadline, so that inactive reviewers don't block the verification process.

#### Acceptance Criteria

1. THE System SHALL set assignment deadline to 7 days from assignment creation
2. WHEN the deadline passes and assignment status is PENDING, THE System SHALL update status to EXPIRED
3. THE System SHALL send warning emails to reviewers 24 hours before deadline
4. THE System SHALL send final reminder emails to reviewers 2 hours before deadline
5. WHERE a reviewer has 2 or more expired assignments, THE System SHALL exclude them from future assignment pools for 30 days

### Requirement 6: Results Calculation and Aggregation

**User Story:** As a submission author, I want the system to calculate peer verification results based on majority vote, so that the outcome reflects collective human judgment.

#### Acceptance Criteria

1. WHEN all 10 reviewers complete their assignments for a verification request, THE System SHALL aggregate the votes
2. WHERE 70% or more reviewers vote "Reinstate", THE System SHALL update submission status to SUBMITTED and set a reinstatement flag
3. WHERE 70% or more reviewers vote "Eliminate", THE System SHALL keep submission status as ELIMINATED and set a confirmation flag
4. WHERE votes are between 40% and 70% for either decision, THE System SHALL keep submission status as ELIMINATED and set an "upheld" flag
5. THE System SHALL calculate the exact vote percentages and store them in submission metadata

### Requirement 7: Results Notification

**User Story:** As a submission author, I want to receive an email when peer verification is complete, so that I know the outcome and next steps.

#### Acceptance Criteria

1. WHEN peer verification results are finalized, THE System SHALL send an email to the submission author within 10 minutes
2. THE email SHALL include the submission code, title, and final decision
3. THE email SHALL include vote breakdown (e.g., "7 reviewers voted Reinstate, 3 voted Eliminate")
4. THE email SHALL include a link to view detailed results on the website
5. WHERE the decision is "Reinstated", THE email SHALL explain that the submission advances to peer review phase

### Requirement 8: Reviewer Integrity Scoring

**User Story:** As a contest administrator, I want to track reviewer accuracy and consistency, so that I can identify high-quality reviewers and potential gaming attempts.

#### Acceptance Criteria

1. WHEN a reviewer evaluates a control submission (accepted elimination or AI-passed), THE System SHALL compare their decision to the AI decision
2. WHERE the reviewer matches the AI decision on a control submission, THE System SHALL award 10 integrity points
3. WHERE the reviewer matches the majority opinion on a verification request, THE System SHALL award 5 integrity points
4. WHERE the reviewer's decision falls in the minority (less than 30%), THE System SHALL deduct 5 integrity points
5. THE System SHALL store cumulative integrity scores in user metadata
6. WHERE a reviewer's integrity score falls below -20, THE System SHALL flag their account for admin review

### Requirement 9: Qualified Evaluator Status

**User Story:** As a reviewer, I want to earn "Qualified Evaluator" status after completing my first 3 assignments, so that I can continue reviewing more submissions and build my reputation.

#### Acceptance Criteria

1. WHEN a reviewer completes 3 assignments with status DONE, THE System SHALL grant "Qualified Evaluator" status
2. THE System SHALL display a "Qualified Evaluator" badge on the reviewer's profile
3. THE System SHALL allow Qualified Evaluators to opt-in to review additional submissions beyond their initial 3
4. THE System SHALL prioritize Qualified Evaluators with high integrity scores for future assignments
5. WHERE a Qualified Evaluator's integrity score drops below 0, THE System SHALL revoke the status

### Requirement 10: Results Display on Screening Results Page

**User Story:** As a submission author, I want to see peer verification results on my screening results page, so that I understand how my peers evaluated my work.

#### Acceptance Criteria

1. WHEN peer verification is complete, THE System SHALL display a "Peer Verification Results" section on the screening results page
2. THE System SHALL display a pie chart showing vote distribution (Reinstate vs Eliminate)
3. THE System SHALL display the final decision (Reinstated, Eliminated, or Upheld)
4. THE System SHALL display anonymized reviewer comments (without reviewer identities)
5. THE System SHALL display the date when verification was completed

### Requirement 11: Admin Monitoring and Override

**User Story:** As a contest administrator, I want to monitor peer verification progress and override results if necessary, so that I can handle edge cases and disputes.

#### Acceptance Criteria

1. THE System SHALL provide an admin dashboard showing all active peer verification requests
2. THE System SHALL display assignment completion rates and reviewer activity
3. THE System SHALL allow admins to manually reassign expired assignments to new reviewers
4. THE System SHALL allow admins to override peer verification results with a written justification
5. THE System SHALL log all admin actions in the audit_logs table

### Requirement 12: Phase Management and Automation

**User Story:** As a contest administrator, I want the system to automatically initiate peer verification when the peer phase begins, so that the process runs smoothly without manual triggering.

#### Acceptance Criteria

1. WHEN the contest phase is updated to PEER_REVIEW, THE System SHALL trigger the assignment service within 5 minutes
2. THE System SHALL check the peer_start_at and peer_end_at timestamps to determine phase boundaries
3. WHERE the current time is within the peer phase window, THE System SHALL process pending verification requests
4. WHERE the peer phase ends and assignments are incomplete, THE System SHALL mark them as EXPIRED
5. THE System SHALL send a summary email to admins when the peer phase completes

### Requirement 13: Anti-Gaming Measures

**User Story:** As a contest administrator, I want to prevent reviewers from gaming the system, so that peer verification results are trustworthy and fair.

#### Acceptance Criteria

1. THE System SHALL enforce a minimum 10-second delay between submitting evaluations to prevent bot submissions
2. THE System SHALL detect and flag reviewers who always vote the same way (100% Eliminate or 100% Reinstate)
3. THE System SHALL detect and flag reviewers whose decisions deviate significantly from the majority (>80% minority votes)
4. WHERE suspicious patterns are detected, THE System SHALL flag the reviewer account and notify admins
5. THE System SHALL exclude flagged reviewers from future assignment pools until admin review

### Requirement 14: Database Schema Enhancements

**User Story:** As a developer, I want the database schema to support all peer verification features, so that data integrity is maintained throughout the process.

#### Acceptance Criteria

1. THE System SHALL add a decision column to peer_reviews table with values ELIMINATE or REINSTATE
2. THE System SHALL add a peer_verification_result jsonb column to submissions table to store vote breakdown
3. THE System SHALL add an integrity_score integer column to users table with default value 0
4. THE System SHALL add a qualified_evaluator boolean column to users table with default value false
5. THE System SHALL add submission_status enum values: REINSTATED, PEER_REVIEW_CONFIRMED, PEER_REVIEW_UPHELD

### Requirement 15: Email Template Creation

**User Story:** As a submission author and reviewer, I want to receive clear, professional emails about peer verification, so that I understand my responsibilities and outcomes.

#### Acceptance Criteria

1. THE System SHALL send "Assignment Notification" emails to reviewers with assignment details and deadline
2. THE System SHALL send "Deadline Warning" emails 24 hours before assignment expiration
3. THE System SHALL send "Final Reminder" emails 2 hours before assignment expiration
4. THE System SHALL send "Verification Complete" emails to authors with results and vote breakdown
5. THE System SHALL send "Qualified Evaluator" emails when reviewers earn the status
