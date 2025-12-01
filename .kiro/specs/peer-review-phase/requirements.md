# Requirements Document: Peer Review Phase (Phase 5)

## Introduction

The Peer Review Phase is a critical stage in the Letters to Goliath contest where submissions that passed AI filtering (status SUBMITTED or REINSTATED) are evaluated by fellow contestants. Each reviewer evaluates 10 randomly assigned submissions using four criteria (clarity, argument, style, moral_depth) on a 1-5 scale, plus a 100-character comment. The peer scores contribute to the final ranking that determines which submissions advance to public voting. Authors who fail to complete their review obligations are disqualified.

**Key Distinction**: This is NOT the same as Peer Verification (the paid $20 appeal process). This is the normal contest phase where all passing submissions receive peer evaluation.

## Glossary

- **System**: The Peer Review backend services and UI components
- **Reviewer**: A contestant with a SUBMITTED or REINSTATED submission who is assigned to evaluate other submissions
- **Assignment**: A pairing of a reviewer with a submission they must evaluate
- **Peer Score**: The average of the four criteria scores (clarity, argument, style, moral_depth) for a submission
- **Trimmed Mean**: Statistical method that removes outliers (highest and lowest scores) before calculating average
- **Review Obligation**: The requirement that each reviewer complete all 10 assigned reviews to avoid disqualification
- **Anonymous Review**: Evaluation where reviewers only see submission code, not author identity
- **Phase Trigger**: Admin action to manually start the peer review phase by changing the contest phase to PEER_REVIEW (via phase dropdown in contest form OR "Update to Suggested" button in phase status component)

## Requirements

### Requirement 1: Phase Activation and Eligibility

**User Story:** As a system administrator, I want to manually trigger the peer review phase from the contest dashboard, so that I have control over when peer review begins.

#### Acceptance Criteria

1. WHEN an admin changes the contest phase to PEER_REVIEW (via phase dropdown in contest edit form OR via "Update to Suggested" button in phase status component), THE System SHALL automatically identify all eligible submissions and create assignments
2. THE System SHALL include submissions with status SUBMITTED in the eligible pool
3. THE System SHALL include submissions with status REINSTATED in the eligible pool
4. THE System SHALL exclude submissions with any other status from peer review
5. THE System SHALL identify all eligible reviewers (users whose submissions have status SUBMITTED or REINSTATED)

### Requirement 2: Database Schema Creation

**User Story:** As a developer, I want separate database tables for peer review to keep it distinct from peer verification, so that the two systems don't interfere with each other.

#### Acceptance Criteria

1. THE System SHALL use a table named peer_review_assignments for storing review assignments
2. THE System SHALL use a table named peer_review_reviews for storing completed reviews
3. THE peer_review_assignments table SHALL have columns: id, submission_id, reviewer_user_id, status, assigned_at, completed_at, deadline
4. THE peer_review_reviews table SHALL have columns: id, assignment_id, clarity, argument, style, moral_depth, comment_100, created_at
5. THE System SHALL create these tables using Supabase migrations before implementing peer review functionality

### Requirement 3: Assignment Algorithm

**User Story:** As a contestant, I want to be assigned 10 random submissions to review, so that I contribute to the peer evaluation process fairly.

#### Acceptance Criteria

1. THE System SHALL assign exactly 10 submissions to each eligible reviewer
2. THE System SHALL select submissions randomly from the eligible pool
3. THE System SHALL prevent reviewers from being assigned their own submission
4. THE System SHALL create peer_review_assignments records with status PENDING for all assignments
5. THE System SHALL set the deadline to 7 days from assignment creation (configurable by admin)

### Requirement 4: Assignment Balance and Fairness

**User Story:** As a submission author, I want my submission to receive approximately the same number of reviews as other submissions, so that evaluation is fair.

#### Acceptance Criteria

1. THE System SHALL distribute assignments to balance the number of reviews each submission receives
2. WHERE the number of reviewers and submissions allows perfect balance, THE System SHALL ensure each submission receives the same number of reviews
3. WHERE perfect balance is not possible, THE System SHALL minimize the difference in review counts between submissions
4. THE System SHALL log the distribution of reviews per submission for admin monitoring
5. THE System SHALL complete assignment creation within 10 minutes for contests with up to 1000 submissions

### Requirement 5: Reviewer Eligibility and Exclusions

**User Story:** As a system administrator, I want only active contestants to serve as reviewers, so that reviews come from engaged participants.

#### Acceptance Criteria

1. THE System SHALL include only users whose submission has status SUBMITTED or REINSTATED in the reviewer pool
2. THE System SHALL exclude users who are banned (is_banned = true) from the reviewer pool
3. THE System SHALL exclude users whose submission was disqualified from the reviewer pool
4. WHERE a user has multiple submissions, THE System SHALL include them as a reviewer if at least one submission is eligible
5. THE System SHALL log the count of eligible reviewers when assignments are created

### Requirement 6: Assignment Deadline Configuration

**User Story:** As a system administrator, I want to configure the review deadline through the admin dashboard, so that I can adjust timing based on contest needs.

#### Acceptance Criteria

1. THE System SHALL provide an admin interface to set the peer review deadline in days
2. THE System SHALL default to 7 days if no custom deadline is configured
3. WHEN assignments are created, THE System SHALL calculate the deadline as current timestamp plus configured days
4. THE System SHALL store the deadline in the peer_review_assignments table
5. THE System SHALL display the deadline to reviewers in their dashboard

### Requirement 7: Reviewer Dashboard

**User Story:** As a reviewer, I want to see my assigned reviews in my dashboard, so that I know what I need to evaluate and by when.

#### Acceptance Criteria

1. WHEN a reviewer visits the dashboard, THE System SHALL display a "Peer Review Tasks" section if assignments exist
2. THE System SHALL show the count of pending, completed, and expired assignments
3. THE System SHALL display a deadline countdown for each pending assignment
4. THE System SHALL provide a "Start Review" button for each pending assignment
5. THE System SHALL show a progress indicator (e.g., "3 of 10 completed")

### Requirement 8: Anonymous Review Interface

**User Story:** As a reviewer, I want to evaluate submissions without knowing the author's identity, so that my judgment is unbiased.

#### Acceptance Criteria

1. WHEN a reviewer accesses an assignment, THE System SHALL display only the submission code, title, and body text
2. THE System SHALL NOT display the author's name, user ID, or any identifying information
3. THE System SHALL NOT display AI screening results or scores
4. THE System SHALL NOT display other reviewers' scores or comments
5. THE System SHALL provide a clean, distraction-free reading interface

### Requirement 9: Review Submission Form

**User Story:** As a reviewer, I want to rate submissions on four criteria and provide a comment, so that I can give comprehensive feedback.

#### Acceptance Criteria

1. THE System SHALL provide four rating scales (clarity, argument, style, moral_depth) with values 1-5
2. THE System SHALL require all four criteria to be rated before submission
3. THE System SHALL provide a comment text field with a maximum of 100 characters
4. THE System SHALL require a comment before allowing submission
5. THE System SHALL display a character counter for the comment field

### Requirement 10: Review Validation and Storage

**User Story:** As a system, I want to validate and store reviews correctly, so that data integrity is maintained.

#### Acceptance Criteria

1. WHEN a review is submitted, THE System SHALL verify the reviewer owns the assignment
2. THE System SHALL verify the assignment status is PENDING
3. THE System SHALL verify the assignment has not expired
4. THE System SHALL create a peer_review_reviews record with all four scores and the comment
5. THE System SHALL update the peer_review_assignments status to DONE and set completed_at timestamp

### Requirement 11: Expired Assignment Handling

**User Story:** As a system administrator, I want expired assignments to be automatically reassigned, so that all submissions receive their full complement of reviews.

#### Acceptance Criteria

1. WHEN an assignment deadline passes and status is PENDING, THE System SHALL update status to EXPIRED
2. THE System SHALL select a new reviewer from the eligible pool who has not already reviewed this submission
3. THE System SHALL create a new peer_review_assignments record with a fresh deadline
4. THE System SHALL send notification email to the new reviewer
5. THE System SHALL log all reassignments for admin monitoring

### Requirement 12: Review Obligation Enforcement

**User Story:** As a system administrator, I want authors who don't complete their reviews to be disqualified, so that everyone contributes fairly.

#### Acceptance Criteria

1. WHEN the peer review phase ends, THE System SHALL check each reviewer's completion status
2. WHERE a reviewer has not completed all 10 assigned reviews, THE System SHALL update their submission status to DISQUALIFIED
3. THE System SHALL send an email notification to disqualified authors explaining the reason
4. THE System SHALL log all disqualifications for admin review
5. THE System SHALL allow admins to manually override disqualifications in exceptional cases

### Requirement 13: Peer Score Calculation

**User Story:** As a submission author, I want my peer score to be calculated fairly from reviewer ratings, so that my submission is ranked accurately.

#### Acceptance Criteria

1. WHEN all reviews for a submission are complete, THE System SHALL calculate the peer score
2. WHERE a submission has 5 or more reviews, THE System SHALL use trimmed mean (remove highest and lowest score for each criterion)
3. WHERE a submission has fewer than 5 reviews, THE System SHALL use simple mean without trimming
4. THE System SHALL calculate the average of the four criteria (clarity, argument, style, moral_depth)
5. THE System SHALL store the result in submissions.score_peer column

### Requirement 14: Score Calculation Timing

**User Story:** As a system administrator, I want peer scores to be calculated automatically as reviews complete, so that rankings are always current.

#### Acceptance Criteria

1. WHEN a review is submitted, THE System SHALL check if all reviews for that submission are complete
2. WHERE all reviews are complete, THE System SHALL immediately calculate and store the peer score
3. WHERE reviews are still pending, THE System SHALL skip score calculation
4. THE System SHALL recalculate scores if an admin overrides or edits a review
5. THE System SHALL log all score calculations with timestamp

### Requirement 15: Results Visibility Control

**User Story:** As a system administrator, I want to control when authors can see their peer review results, so that I can manage the contest timeline.

#### Acceptance Criteria

1. THE System SHALL provide an admin toggle to enable/disable peer review results visibility
2. WHEN results visibility is disabled, THE System SHALL hide all peer scores and comments from authors
3. WHEN results visibility is enabled, THE System SHALL display peer scores and anonymized comments to authors
4. THE System SHALL default to disabled visibility until admin explicitly enables it
5. THE System SHALL log visibility changes in the audit log

### Requirement 16: Results Display for Authors

**User Story:** As a submission author, I want to see my peer review results and feedback, so that I understand how my submission was evaluated.

#### Acceptance Criteria

1. WHEN results visibility is enabled, THE System SHALL display the peer score on the submission detail page
2. THE System SHALL display a breakdown of scores for each criterion (clarity, argument, style, moral_depth)
3. THE System SHALL display all reviewer comments anonymously (no reviewer identities)
4. THE System SHALL display the number of reviews received
5. THE System SHALL display the submission's rank among all submissions (if available)

### Requirement 17: Finalist Selection Configuration

**User Story:** As a system administrator, I want to configure how many submissions advance to public voting, so that I can control the finalist pool size.

#### Acceptance Criteria

1. THE System SHALL provide an admin interface to set the number of finalists (top N by peer score)
2. THE System SHALL default to top 100 submissions if no custom value is configured
3. WHEN the peer review phase ends, THE System SHALL rank all submissions by score_peer
4. THE System SHALL select the top N submissions to advance to public voting
5. THE System SHALL log the finalist selection criteria and results

### Requirement 18: Automatic Ranking and Finalist Selection

**User Story:** As a system administrator, I want the system to automatically rank submissions and select finalists, so that the transition to public voting is seamless.

#### Acceptance Criteria

1. WHEN the peer review phase ends, THE System SHALL calculate final peer scores for all submissions
2. THE System SHALL rank submissions in descending order by score_peer
3. THE System SHALL select the top N submissions (where N is configured by admin)
4. THE System SHALL update the contest phase to PUBLIC_VOTING
5. THE System SHALL make only finalist submissions visible in the public voting interface

### Requirement 19: Admin Monitoring Dashboard

**User Story:** As a system administrator, I want to monitor peer review progress, so that I can identify and resolve issues quickly.

#### Acceptance Criteria

1. THE System SHALL provide an admin dashboard showing peer review statistics
2. THE System SHALL display total assignments, completed reviews, and pending reviews
3. THE System SHALL display reviewer completion rates (percentage of assigned reviews completed)
4. THE System SHALL highlight reviewers at risk of disqualification (incomplete reviews near deadline)
5. THE System SHALL display submissions with insufficient reviews

### Requirement 20: Admin Manual Reassignment

**User Story:** As a system administrator, I want to manually reassign reviews in exceptional cases, so that I can handle edge cases and disputes.

#### Acceptance Criteria

1. THE System SHALL allow admins to manually reassign a specific assignment to a different reviewer
2. THE System SHALL require admin to select a new reviewer from the eligible pool
3. THE System SHALL create a new peer_review_assignments record with the new reviewer
4. THE System SHALL mark the old assignment as EXPIRED
5. THE System SHALL log all manual reassignments in the audit log

### Requirement 21: Admin Score Override

**User Story:** As a system administrator, I want to manually override peer scores in exceptional cases, so that I can correct errors or handle disputes.

#### Acceptance Criteria

1. THE System SHALL allow admins to manually edit individual review scores
2. THE System SHALL require a written justification for any score override
3. THE System SHALL recalculate the submission's peer score after override
4. THE System SHALL log all score overrides in the audit log with justification
5. THE System SHALL send notification email to the submission author when their score is overridden

### Requirement 22: Email Notifications

**User Story:** As a user, I want to receive clear emails about peer review, so that I understand my responsibilities and outcomes.

#### Acceptance Criteria

1. THE System SHALL send "Assignment Notification" emails to reviewers when assignments are created
2. THE System SHALL send "Deadline Warning" emails 24 hours before assignment expiration
3. THE System SHALL send "Disqualification Notice" emails to authors whose submissions are disqualified
4. THE System SHALL send "Results Available" emails to authors when results visibility is enabled
5. THE System SHALL send "Reassignment Notification" emails when assignments are reassigned

### Requirement 23: Performance and Scalability

**User Story:** As a system administrator, I want the peer review system to handle large contests efficiently, so that it scales with contest growth.

#### Acceptance Criteria

1. THE System SHALL create assignments for 1000 submissions within 10 minutes
2. THE System SHALL handle 100 concurrent review submissions without performance degradation
3. THE System SHALL calculate peer scores within 5 seconds of the last review completion
4. THE System SHALL use database indexes on peer_review_assignments(reviewer_user_id, status) and peer_review_assignments(submission_id, status)
5. THE System SHALL send notification emails asynchronously to avoid blocking operations

### Requirement 24: Data Integrity and Constraints

**User Story:** As a developer, I want database constraints to enforce data integrity, so that invalid data cannot be stored.

#### Acceptance Criteria

1. THE System SHALL enforce that clarity, argument, style, and moral_depth scores are between 1 and 5
2. THE System SHALL enforce that comment_100 is maximum 100 characters
3. THE System SHALL enforce that each assignment has a unique combination of submission_id and reviewer_user_id
4. THE System SHALL enforce foreign key constraints between peer_review_assignments and submissions
5. THE System SHALL enforce foreign key constraints between peer_review_reviews and peer_review_assignments

### Requirement 25: Transition to Public Voting

**User Story:** As a system administrator, I want the system to smoothly transition from peer review to public voting, so that the contest progresses seamlessly.

#### Acceptance Criteria

1. WHEN the peer review phase ends, THE System SHALL finalize all peer scores
2. THE System SHALL disqualify authors who didn't complete their review obligations
3. THE System SHALL select finalists based on configured top N by peer score
4. THE System SHALL update the contest phase to PUBLIC_VOTING
5. THE System SHALL send notification emails to finalists informing them they advanced
