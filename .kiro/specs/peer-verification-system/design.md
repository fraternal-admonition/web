# Design Document: Peer Verification System

## Overview

The Peer Verification System is a comprehensive backend service and UI framework that executes the peer review workflow for AI-eliminated submissions. The system follows the existing architectural patterns established in the AI Screening Service, using Supabase for data persistence, Next.js API routes for backend logic, and React components for the frontend interface.

The system consists of five major components:
1. **Assignment Service** - Assigns reviewers to submissions
2. **Reviewer Dashboard** - UI for reviewers to complete evaluations
3. **Evaluation Service** - Processes and stores reviewer decisions
4. **Results Service** - Aggregates votes and determines outcomes
5. **Phase Manager** - Orchestrates the peer verification lifecycle

## Architecture

### System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Contest Phase Transition                     │
│                    (PEER_REVIEW phase begins)                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Assignment Service                          │
│  - Query PEER_VERIFICATION_PENDING submissions                  │
│  - Select eligible reviewers                                     │
│  - Create peer_assignments (10 per verification request)         │
│  - Assign 3 submissions per reviewer (1 B2, 1 A, 1 passed)      │
│  - Send assignment notification emails                           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Reviewer Dashboard                          │
│  - Display pending assignments                                   │
│  - Show deadline countdown                                       │
│  - Provide "Start Review" action                                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Evaluation Interface                          │
│  - Display submission (blind - no AI decision shown)             │
│  - Collect decision (Eliminate / Reinstate)                      │
│  - Collect comment (max 100 chars)                               │
│  - Submit evaluation                                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Evaluation Service                           │
│  - Validate reviewer ownership of assignment                     │
│  - Create peer_reviews record                                    │
│  - Update assignment status to DONE                              │
│  - Calculate integrity score delta                               │
│  - Check if all 10 reviews complete                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Results Service                            │
│  - Aggregate votes (count Eliminate vs Reinstate)                │
│  - Calculate percentages                                         │
│  - Determine outcome (≥70% Reinstate, ≥70% Eliminate, 40-70%)   │
│  - Update submission status and metadata                         │
│  - Send results notification email                               │
│  - Update reviewer integrity scores                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Results Display (UI)                          │
│  - Show vote breakdown pie chart                                 │
│  - Display final decision                                        │
│  - Show anonymized reviewer comments                             │
└─────────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Backend**: Next.js 15 API Routes (TypeScript)
- **Database**: Supabase (PostgreSQL)
- **Email**: Resend API
- **Frontend**: React 19, Framer Motion, Tailwind CSS
- **Authentication**: Supabase Auth
- **Scheduling**: Vercel Cron Jobs (for deadline checks)

## Components and Interfaces

### 1. Assignment Service

**Location**: `src/lib/peer-verification/assignment-service.ts`

**Purpose**: Orchestrates the assignment of reviewers to submissions when the peer phase begins.

**Key Functions**:

```typescript
/**
 * Main entry point - called when contest enters PEER_REVIEW phase
 */
export async function executeAssignments(contestId: string): Promise<void>

/**
 * Get all submissions requesting peer verification
 */
async function getVerificationRequests(contestId: string): Promise<Submission[]>

/**
 * Get eligible reviewers (contestants with submissions)
 */
async function getEligibleReviewers(contestId: string): Promise<User[]>

/**
 * Assign 10 reviewers to a verification request
 */
async function assignReviewers(
  submissionId: string,
  reviewers: User[],
  contestId: string
): Promise<void>

/**
 * Assign 3 submissions to each reviewer
 * - 1 verification request (B2)
 * - 1 accepted elimination (A)
 * - 1 AI-passed submission
 */
async function assignSubmissionsToReviewer(
  reviewerId: string,
  verificationRequests: Submission[],
  controlSubmissions: Submission[]
): Promise<void>

/**
 * Send assignment notification emails
 */
async function notifyReviewers(assignments: Assignment[]): Promise<void>
```

**Algorithm for Reviewer Selection**:
1. Query all users with at least one submission in the contest
2. Exclude banned users (is_banned = true)
3. Exclude users who are authors of the verification request
4. Prioritize users with high integrity scores
5. Distribute assignments evenly to prevent overloading
6. Randomly select 10 reviewers from the eligible pool

**Algorithm for Submission Assignment**:
1. For each reviewer, select 1 verification request they haven't reviewed
2. Select 1 submission with status ELIMINATED where user chose Option A
3. Select 1 submission with status SUBMITTED (AI passed)
4. Ensure no reviewer evaluates their own submission
5. Create peer_assignments records for all 3 submissions

---

### 2. Reviewer Dashboard Component

**Location**: `src/app/dashboard/peer-evaluations/page.tsx`

**Purpose**: Display assigned evaluation tasks to reviewers.

**UI Structure**:

```tsx
<DashboardLayout>
  <PeerEvaluationsHeader 
    pendingCount={pendingAssignments.length}
    completedCount={completedAssignments.length}
  />
  
  <PendingAssignmentsSection>
    {pendingAssignments.map(assignment => (
      <AssignmentCard
        key={assignment.id}
        assignment={assignment}
        deadline={assignment.deadline}
        onStartReview={() => navigate(`/peer-evaluation/${assignment.id}`)}
      />
    ))}
  </PendingAssignmentsSection>
  
  <CompletedAssignmentsSection>
    {completedAssignments.map(assignment => (
      <CompletedAssignmentCard
        key={assignment.id}
        assignment={assignment}
        decision={assignment.peer_reviews.decision}
      />
    ))}
  </CompletedAssignmentsSection>
</DashboardLayout>
```

**Data Fetching**:
```typescript
// API Route: /api/peer-evaluations/assignments
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data: assignments } = await supabase
    .from('peer_assignments')
    .select('*, submissions(*), peer_reviews(*)')
    .eq('reviewer_user_id', user.id)
    .order('assigned_at', { ascending: false });
  
  return NextResponse.json({ assignments });
}
```

---

### 3. Evaluation Interface Component

**Location**: `src/app/peer-evaluation/[assignmentId]/page.tsx`

**Purpose**: Allow reviewers to evaluate a submission without knowing the AI decision.

**UI Structure**:

```tsx
<EvaluationLayout>
  <SubmissionDisplay
    title={submission.title}
    bodyText={submission.body_text}
    // NO AI decision, scores, or author identity shown
  />
  
  <EvaluationForm onSubmit={handleSubmit}>
    <DecisionButtons>
      <Button 
        variant={decision === 'ELIMINATE' ? 'destructive' : 'outline'}
        onClick={() => setDecision('ELIMINATE')}
      >
        Eliminate
      </Button>
      <Button 
        variant={decision === 'REINSTATE' ? 'success' : 'outline'}
        onClick={() => setDecision('REINSTATE')}
      >
        Reinstate
      </Button>
    </DecisionButtons>
    
    <CommentField
      maxLength={100}
      value={comment}
      onChange={setComment}
      placeholder="Brief explanation for your decision (max 100 characters)"
    />
    
    <SubmitButton disabled={!decision || !comment}>
      Submit Evaluation
    </SubmitButton>
  </EvaluationForm>
</EvaluationLayout>
```

**Security Checks**:
- Verify user owns the assignment
- Verify assignment status is PENDING
- Verify assignment has not expired
- Verify user is not the submission author

---

### 4. Evaluation Service

**Location**: `src/lib/peer-verification/evaluation-service.ts`

**Purpose**: Process and store reviewer evaluations.

**Key Functions**:

```typescript
/**
 * Submit a peer evaluation
 */
export async function submitEvaluation(
  assignmentId: string,
  reviewerId: string,
  decision: 'ELIMINATE' | 'REINSTATE',
  comment: string
): Promise<void>

/**
 * Validate evaluation submission
 */
async function validateEvaluation(
  assignmentId: string,
  reviewerId: string
): Promise<boolean>

/**
 * Create peer_reviews record
 */
async function createReview(
  assignmentId: string,
  decision: string,
  comment: string
): Promise<void>

/**
 * Update assignment status to DONE
 */
async function completeAssignment(assignmentId: string): Promise<void>

/**
 * Check if all 10 reviews are complete for a submission
 */
async function checkCompletionStatus(submissionId: string): Promise<boolean>

/**
 * Trigger results calculation if all reviews complete
 */
async function triggerResultsCalculation(submissionId: string): Promise<void>
```

**API Route**: `/api/peer-evaluations/submit`

```typescript
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const { assignment_id, decision, comment } = await request.json();
  
  // Security checks
  const isValid = await validateEvaluation(assignment_id, user.id);
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid assignment' }, { status: 403 });
  }
  
  // Submit evaluation
  await submitEvaluation(assignment_id, user.id, decision, comment);
  
  return NextResponse.json({ success: true });
}
```

---

### 5. Results Service

**Location**: `src/lib/peer-verification/results-service.ts`

**Purpose**: Aggregate votes, determine outcomes, and notify participants.

**Key Functions**:

```typescript
/**
 * Calculate results for a verification request
 */
export async function calculateResults(submissionId: string): Promise<void>

/**
 * Aggregate votes from all 10 reviewers
 */
async function aggregateVotes(submissionId: string): Promise<VoteBreakdown>

/**
 * Determine outcome based on vote percentages
 */
function determineOutcome(voteBreakdown: VoteBreakdown): VerificationOutcome

/**
 * Update submission status and metadata
 */
async function updateSubmissionStatus(
  submissionId: string,
  outcome: VerificationOutcome,
  voteBreakdown: VoteBreakdown
): Promise<void>

/**
 * Calculate and update reviewer integrity scores
 */
async function updateIntegrityScores(submissionId: string): Promise<void>

/**
 * Send results notification email to author
 */
async function notifyAuthor(
  submissionId: string,
  outcome: VerificationOutcome,
  voteBreakdown: VoteBreakdown
): Promise<void>
```

**Vote Aggregation Logic**:

```typescript
interface VoteBreakdown {
  total: number;
  eliminate: number;
  reinstate: number;
  eliminatePercentage: number;
  reinstatePercentage: number;
}

function determineOutcome(votes: VoteBreakdown): VerificationOutcome {
  if (votes.reinstatePercentage >= 70) {
    return {
      decision: 'REINSTATED',
      status: 'SUBMITTED', // Advances to peer review
      message: 'Peer verification overturned AI elimination'
    };
  }
  
  if (votes.eliminatePercentage >= 70) {
    return {
      decision: 'PEER_REVIEW_CONFIRMED',
      status: 'ELIMINATED',
      message: 'Peer verification confirmed AI elimination'
    };
  }
  
  // Between 40-70%
  return {
    decision: 'PEER_REVIEW_UPHELD',
    status: 'ELIMINATED',
    message: 'AI decision upheld due to lack of consensus'
  };
}
```

**Integrity Score Calculation**:

```typescript
async function calculateIntegrityDelta(
  reviewerId: string,
  submissionId: string,
  decision: string
): Promise<number> {
  // Get submission details
  const submission = await getSubmission(submissionId);
  const aiDecision = submission.ai_screenings[0].status;
  
  // Control submission (accepted elimination or AI passed)
  if (submission.status !== 'PEER_VERIFICATION_PENDING') {
    // Match AI decision = +10 points
    if (
      (aiDecision === 'FAILED' && decision === 'ELIMINATE') ||
      (aiDecision === 'PASSED' && decision === 'REINSTATE')
    ) {
      return 10;
    }
    return 0; // No penalty for control submissions
  }
  
  // Verification request - check against majority
  const voteBreakdown = await aggregateVotes(submissionId);
  const majorityDecision = voteBreakdown.reinstatePercentage > 50 
    ? 'REINSTATE' 
    : 'ELIMINATE';
  
  if (decision === majorityDecision) {
    // In majority = +5 points
    return 5;
  } else if (
    (decision === 'REINSTATE' && voteBreakdown.reinstatePercentage < 30) ||
    (decision === 'ELIMINATE' && voteBreakdown.eliminatePercentage < 30)
  ) {
    // In small minority (<30%) = -5 points
    return -5;
  }
  
  return 0; // In minority but not extreme
}
```

---

### 6. Phase Manager

**Location**: `src/lib/peer-verification/phase-manager.ts`

**Purpose**: Orchestrate the peer verification lifecycle based on contest phase.

**Key Functions**:

```typescript
/**
 * Trigger when contest phase changes to PEER_REVIEW
 */
export async function initiatePeerPhase(contestId: string): Promise<void>

/**
 * Check for expired assignments and mark them
 */
export async function checkExpiredAssignments(): Promise<void>

/**
 * Send deadline warning emails
 */
export async function sendDeadlineWarnings(): Promise<void>

/**
 * Complete peer phase and finalize results
 */
export async function finalizePeerPhase(contestId: string): Promise<void>
```

**Cron Job Configuration** (Vercel):

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/check-assignment-deadlines",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/send-deadline-warnings",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

**API Routes**:
- `/api/cron/check-assignment-deadlines` - Runs hourly to mark expired assignments
- `/api/cron/send-deadline-warnings` - Runs every 6 hours to send reminders

---

### 7. Results Display Component

**Location**: `src/app/contest/screening-results/[submissionId]/PeerVerificationResults.tsx`

**Purpose**: Display peer verification results on the screening results page.

**UI Structure**:

```tsx
<PeerVerificationResultsSection>
  <ResultsHeader>
    <StatusBadge status={outcome.decision} />
    <CompletionDate date={completedAt} />
  </ResultsHeader>
  
  <VoteBreakdownChart>
    <PieChart
      data={[
        { label: 'Reinstate', value: reinstateCount, color: '#2E7D32' },
        { label: 'Eliminate', value: eliminateCount, color: '#C62828' }
      ]}
    />
    <VoteStats>
      <Stat label="Reinstate" value={`${reinstateCount}/10`} percentage={reinstatePercentage} />
      <Stat label="Eliminate" value={`${eliminateCount}/10`} percentage={eliminatePercentage} />
    </VoteStats>
  </VoteBreakdownChart>
  
  <FinalDecision>
    {outcome.decision === 'REINSTATED' && (
      <SuccessMessage>
        Your submission has been reinstated and will advance to peer review!
      </SuccessMessage>
    )}
    {outcome.decision === 'PEER_REVIEW_CONFIRMED' && (
      <FailureMessage>
        Peer verification confirmed the AI elimination decision.
      </FailureMessage>
    )}
    {outcome.decision === 'PEER_REVIEW_UPHELD' && (
      <NeutralMessage>
        AI decision upheld due to lack of clear consensus.
      </NeutralMessage>
    )}
  </FinalDecision>
  
  <ReviewerComments>
    <h3>Reviewer Feedback</h3>
    {comments.map((comment, index) => (
      <CommentCard key={index}>
        <CommentText>{comment.text}</CommentText>
        <CommentDecision decision={comment.decision} />
      </CommentCard>
    ))}
  </ReviewerComments>
</PeerVerificationResultsSection>
```

---

## Data Models

### Database Schema Changes

**1. Add decision column to peer_reviews**:

```sql
ALTER TABLE peer_reviews 
ADD COLUMN decision TEXT CHECK (decision IN ('ELIMINATE', 'REINSTATE'));

-- Make decision required
ALTER TABLE peer_reviews 
ALTER COLUMN decision SET NOT NULL;
```

**2. Add peer verification result to submissions**:

```sql
ALTER TABLE submissions 
ADD COLUMN peer_verification_result JSONB DEFAULT NULL;

-- Example structure:
-- {
--   "total_votes": 10,
--   "eliminate_votes": 3,
--   "reinstate_votes": 7,
--   "eliminate_percentage": 30,
--   "reinstate_percentage": 70,
--   "outcome": "REINSTATED",
--   "completed_at": "2025-01-15T10:30:00Z"
-- }
```

**3. Add integrity score to users**:

```sql
ALTER TABLE users 
ADD COLUMN integrity_score INTEGER DEFAULT 0;

ALTER TABLE users 
ADD COLUMN qualified_evaluator BOOLEAN DEFAULT FALSE;
```

**4. Add new submission status values**:

```sql
ALTER TYPE submission_status 
ADD VALUE 'REINSTATED';

ALTER TYPE submission_status 
ADD VALUE 'PEER_REVIEW_CONFIRMED';

ALTER TYPE submission_status 
ADD VALUE 'PEER_REVIEW_UPHELD';
```

**5. Add deadline to peer_assignments**:

```sql
ALTER TABLE peer_assignments 
ADD COLUMN deadline TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days');
```

---

## Error Handling

### Assignment Service Errors

1. **Insufficient Reviewers**: If fewer than 10 eligible reviewers exist, log warning and assign available reviewers
2. **Insufficient Control Submissions**: If not enough control submissions exist, use available submissions and log warning
3. **Database Errors**: Rollback assignment transaction and retry up to 3 times
4. **Email Failures**: Log error but don't fail assignment process

### Evaluation Service Errors

1. **Invalid Assignment**: Return 403 Forbidden if user doesn't own assignment
2. **Expired Assignment**: Return 400 Bad Request if deadline passed
3. **Duplicate Submission**: Return 400 Bad Request if review already exists
4. **Database Errors**: Return 500 Internal Server Error and log for admin review

### Results Service Errors

1. **Incomplete Reviews**: Don't calculate results until all 10 reviews complete
2. **Email Failures**: Log error but mark results as complete
3. **Database Errors**: Retry up to 3 times, then mark for manual admin review

---

## Testing Strategy

### Unit Tests

1. **Assignment Algorithm**: Test reviewer selection logic with various pool sizes
2. **Vote Aggregation**: Test outcome determination with different vote distributions
3. **Integrity Score Calculation**: Test score deltas for all scenarios
4. **Deadline Calculation**: Test expiration logic with various timestamps

### Integration Tests

1. **End-to-End Assignment Flow**: Create verification request → assign reviewers → verify assignments created
2. **End-to-End Evaluation Flow**: Submit evaluation → verify review created → check completion status
3. **End-to-End Results Flow**: Complete all 10 reviews → verify results calculated → check email sent

### Manual Testing Scenarios

1. **Happy Path**: User requests verification → reviewers complete evaluations → results calculated → author notified
2. **Expired Assignment**: Assignment deadline passes → status updated to EXPIRED → new reviewer assigned
3. **Tied Vote**: 5 Eliminate, 5 Reinstate → verify "upheld" outcome
4. **Unanimous Vote**: 10 Reinstate → verify "reinstated" outcome
5. **Admin Override**: Admin manually changes result → verify audit log created

---

## Security Considerations

1. **Blind Review Enforcement**: Never expose AI decision or author identity in evaluation interface
2. **Assignment Ownership**: Verify reviewer owns assignment before allowing evaluation
3. **Rate Limiting**: Enforce 10-second minimum between evaluation submissions
4. **Gaming Detection**: Flag reviewers with suspicious voting patterns
5. **Admin Audit Trail**: Log all admin actions in audit_logs table
6. **Data Sanitization**: Remove PII from logs and error messages

---

## Performance Considerations

1. **Batch Assignment**: Process all verification requests in a single transaction
2. **Async Email Sending**: Queue emails and send asynchronously to avoid blocking
3. **Caching**: Cache eligible reviewer lists for 1 hour to reduce database queries
4. **Indexing**: Add indexes on peer_assignments(reviewer_user_id, status) and peer_assignments(submission_id, status)
5. **Pagination**: Paginate reviewer dashboard for users with many assignments

---

## Deployment Plan

### Phase 1: Database Migration
1. Run SQL migrations to add new columns and enum values
2. Verify schema changes in staging environment
3. Deploy to production during low-traffic window

### Phase 2: Backend Services
1. Deploy assignment service
2. Deploy evaluation service
3. Deploy results service
4. Deploy phase manager and cron jobs

### Phase 3: Frontend Components
1. Deploy reviewer dashboard
2. Deploy evaluation interface
3. Deploy results display component

### Phase 4: Email Templates
1. Create and test all email templates
2. Deploy email service updates

### Phase 5: Admin Tools
1. Deploy admin monitoring dashboard
2. Deploy admin override functionality

### Phase 6: Testing and Validation
1. Run integration tests in staging
2. Perform manual testing with test accounts
3. Monitor logs for errors
4. Deploy to production

---

## Monitoring and Observability

1. **Assignment Metrics**: Track assignment creation rate, reviewer distribution, email delivery rate
2. **Evaluation Metrics**: Track evaluation submission rate, average time to complete, expiration rate
3. **Results Metrics**: Track outcome distribution (reinstated vs confirmed vs upheld), average vote percentages
4. **Integrity Metrics**: Track average integrity scores, flagged reviewer count, qualified evaluator count
5. **Error Metrics**: Track API error rates, database errors, email failures
6. **Performance Metrics**: Track API response times, database query times, email send times

**Logging Strategy**:
- Log all assignment creations with reviewer IDs and submission IDs
- Log all evaluation submissions with decision and timestamp
- Log all results calculations with vote breakdown
- Log all integrity score updates with delta values
- Log all admin actions with user ID and justification
