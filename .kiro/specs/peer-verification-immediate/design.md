# Design Document: Peer Verification System (Immediate Processing)

## Overview

The Peer Verification System is an immediate-processing appeal mechanism that operates independently of contest phases. When an author pays $20 to challenge an AI elimination, the system immediately assigns 10 reviewers, who have 7 days to complete blind evaluations. The system uses control submissions to measure reviewer accuracy, calculates results based on majority vote, and reinstates submissions into the current contest phase if approved.

**Key Design Principles:**
1. **Immediate Processing**: No waiting for contest phase transitions
2. **Independence**: Operates parallel to normal contest flow
3. **Blind Review**: Reviewers never know which submission is the verification request
4. **Fast Turnaround**: 7-14 day completion target
5. **Accuracy Measurement**: Control submissions test reviewer quality

## Architecture

### System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Payment Webhook                              │
│              (purpose = PEER_VERIFICATION)                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              Immediate Assignment Service                        │
│  - Update submission status to PEER_VERIFICATION_PENDING         │
│  - Select 10 eligible reviewers                                  │
│  - Create 30 assignments (10 reviewers × 3 submissions each)     │
│  - Send notification emails                                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Reviewer Dashboard                          │
│  - Display pending assignments with countdown                    │
│  - Show "Start Review" button                                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Blind Evaluation Interface                    │
│  - Display submission (no AI decision, no status)                │
│  - Collect decision (Eliminate / Reinstate)                      │
│  - Collect comment (max 100 chars)                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Evaluation Service                           │
│  - Validate reviewer ownership                                   │
│  - Create peer_reviews record                                    │
│  - Update assignment status to DONE                              │
│  - Check if all 10 reviews complete                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Results Service                            │
│  - Aggregate votes (count Eliminate vs Reinstate)                │
│  - Calculate percentages                                         │
│  - Determine outcome (≥70% Reinstate, ≥70% Eliminate, 40-70%)   │
│  - Update submission status (REINSTATED or stay ELIMINATED)      │
│  - Calculate integrity scores for all reviewers                  │
│  - Send results notification email                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Results Display (UI)                          │
│  - Show vote breakdown chart                                     │
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
- **Background Jobs**: Vercel Cron Jobs (for deadline checks and expired assignment handling)

## Components and Interfaces

### 1. Immediate Assignment Service

**Location**: `src/lib/peer-verification/immediate-assignment-service.ts`

**Purpose**: Triggered immediately by payment webhook to assign reviewers without waiting for contest phase.

**Key Functions**:

```typescript
/**
 * Main entry point - called immediately after payment webhook confirms
 */
export async function executeImmediateAssignment(submissionId: string): Promise<void>

/**
 * Get eligible reviewers for this contest
 */
async function getEligibleReviewers(contestId: string, excludeUserId: string): Promise<User[]>

/**
 * Randomly select 10 reviewers from eligible pool
 */
async function selectReviewers(eligibleReviewers: User[], count: number): Promise<User[]>

/**
 * Assign the verification request + 2 control submissions to each reviewer
 */
async function assignSubmissionsToReviewers(
  verificationSubmissionId: string,
  reviewers: User[],
  contestId: string
): Promise<void>

/**
 * Get control submissions (1 AI-passed, 1 AI-eliminated with Option A)
 */
async function getControlSubmissions(contestId: string, count: number): Promise<{
  passed: Submission[],
  eliminated: Submission[]
}>

/**
 * Create peer_assignments records with 7-day deadline
 */
async function createAssignments(
  reviewerId: string,
  submissions: Submission[],
  deadline: Date
): Promise<void>

/**
 * Send assignment notification emails to all reviewers
 */
async function notifyReviewers(assignments: Assignment[]): Promise<void>
```

**Webhook Integration**:

```typescript
// In src/app/api/webhooks/stripe/route.ts
if (purpose === 'PEER_VERIFICATION') {
  // Update submission status
  await adminSupabase
    .from('submissions')
    .update({ status: 'PEER_VERIFICATION_PENDING' })
    .eq('id', submissionId);
  
  // IMMEDIATELY trigger assignment (don't wait for phase)
  await executeImmediateAssignment(submissionId);
  
  // Send confirmation email (already implemented)
  await sendPeerVerificationConfirmationEmail(email, submissionData);
}
```

---

### 2. Reviewer Dashboard Component

**Location**: `src/app/dashboard/peer-verification-tasks/page.tsx`

**Purpose**: Display assigned verification tasks to reviewers with deadlines.

**UI Structure**:

```tsx
<DashboardLayout>
  <PageHeader 
    title="Peer Verification Tasks"
    description="Review submissions to help ensure fair AI decisions"
  />
  
  <TasksSummary
    pendingCount={pendingAssignments.length}
    completedCount={completedAssignments.length}
    expiredCount={expiredAssignments.length}
  />
  
  <PendingAssignmentsSection>
    {pendingAssignments.map(assignment => (
      <AssignmentCard
        key={assignment.id}
        assignment={assignment}
        deadline={assignment.deadline}
        onStartReview={() => navigate(`/peer-verification/review/${assignment.id}`)}
      />
    ))}
  </PendingAssignmentsSection>
  
  <CompletedAssignmentsSection>
    {completedAssignments.map(assignment => (
      <CompletedAssignmentCard
        key={assignment.id}
        assignment={assignment}
        decision={assignment.peer_reviews.decision}
        submittedAt={assignment.completed_at}
      />
    ))}
  </CompletedAssignmentsSection>
  
  <IntegrityScoreCard
    score={user.integrity_score}
    qualifiedEvaluator={user.qualified_evaluator}
  />
</DashboardLayout>
```

---

### 3. Blind Evaluation Interface Component

**Location**: `src/app/peer-verification/review/[assignmentId]/page.tsx`

**Purpose**: Allow reviewers to evaluate submissions without knowing AI decision or verification status.

**UI Structure**:

```tsx
<EvaluationLayout>
  <EvaluationHeader
    assignmentNumber={currentIndex + 1}
    totalAssignments={3}
    deadline={assignment.deadline}
  />
  
  <SubmissionDisplay
    title={submission.title}
    bodyText={submission.body_text}
    // NO AI decision, scores, status, or author identity shown
  />
  
  <BlindReviewNotice>
    You are evaluating this submission without knowing the AI's decision.
    Make your judgment based solely on the content.
  </BlindReviewNotice>
  
  <EvaluationForm onSubmit={handleSubmit}>
    <DecisionButtons>
      <Button 
        variant={decision === 'ELIMINATE' ? 'destructive' : 'outline'}
        onClick={() => setDecision('ELIMINATE')}
        size="lg"
      >
        <XCircle className="mr-2" />
        Eliminate
      </Button>
      <Button 
        variant={decision === 'REINSTATE' ? 'success' : 'outline'}
        onClick={() => setDecision('REINSTATE')}
        size="lg"
      >
        <CheckCircle className="mr-2" />
        Reinstate
      </Button>
    </DecisionButtons>
    
    <CommentField
      maxLength={100}
      value={comment}
      onChange={setComment}
      placeholder="Brief explanation for your decision (max 100 characters)"
      required
    />
    
    <SubmitButton disabled={!decision || !comment || isSubmitting}>
      {isSubmitting ? 'Submitting...' : 'Submit Evaluation'}
    </SubmitButton>
  </EvaluationForm>
</EvaluationLayout>
```

---

### 4. Evaluation Service

**Location**: `src/lib/peer-verification/evaluation-service.ts`

**Purpose**: Process and store reviewer evaluations, check completion status.

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
): Promise<{ valid: boolean; error?: string }>

/**
 * Create peer_reviews record and update assignment
 */
async function createReview(
  assignmentId: string,
  decision: string,
  comment: string
): Promise<void>

/**
 * Check if all reviews are complete for the verification request
 */
async function checkVerificationCompletion(submissionId: string): Promise<{
  complete: boolean;
  completedCount: number;
  totalCount: number;
}>

/**
 * Trigger results calculation if all reviews complete
 */
async function triggerResultsCalculation(submissionId: string): Promise<void>
```

**API Route**: `/api/peer-verification/submit`

```typescript
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const { assignment_id, decision, comment } = await request.json();
  
  // Validate
  const validation = await validateEvaluation(assignment_id, user.id);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 403 });
  }
  
  // Check rate limit (10 seconds between submissions)
  const lastSubmission = await getLastSubmissionTime(user.id);
  if (lastSubmission && Date.now() - lastSubmission < 10000) {
    return NextResponse.json(
      { error: 'Please wait 10 seconds between submissions' },
      { status: 429 }
    );
  }
  
  // Submit evaluation
  await submitEvaluation(assignment_id, user.id, decision, comment);
  
  // Check if verification is complete
  const assignment = await getAssignment(assignment_id);
  const completion = await checkVerificationCompletion(assignment.submission_id);
  
  if (completion.complete) {
    // Trigger results calculation asynchronously
    triggerResultsCalculation(assignment.submission_id).catch(console.error);
  }
  
  return NextResponse.json({ success: true, completion });
}
```

---

### 5. Results Service

**Location**: `src/lib/peer-verification/results-service.ts`

**Purpose**: Aggregate votes, determine outcomes, update statuses, calculate integrity scores.

**Key Functions**:

```typescript
/**
 * Calculate results for a verification request
 */
export async function calculateResults(submissionId: string): Promise<void>

/**
 * Aggregate votes from all reviewers
 */
async function aggregateVotes(submissionId: string): Promise<VoteBreakdown>

/**
 * Determine outcome based on vote percentages
 */
function determineOutcome(voteBreakdown: VoteBreakdown): VerificationOutcome

/**
 * Update submission status based on outcome
 */
async function updateSubmissionStatus(
  submissionId: string,
  outcome: VerificationOutcome,
  voteBreakdown: VoteBreakdown
): Promise<void>

/**
 * Calculate and update integrity scores for all reviewers
 */
async function updateIntegrityScores(submissionId: string): Promise<void>

/**
 * Check and grant Qualified Evaluator status
 */
async function checkQualifiedEvaluatorStatus(reviewerId: string): Promise<void>

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
  completedAt: string;
}

function determineOutcome(votes: VoteBreakdown): VerificationOutcome {
  if (votes.reinstatePercentage >= 70) {
    return {
      decision: 'REINSTATED',
      newStatus: 'REINSTATED',
      message: 'Peer verification overturned AI elimination. Your submission has been reinstated.'
    };
  }
  
  if (votes.eliminatePercentage >= 70) {
    return {
      decision: 'ELIMINATED_CONFIRMED',
      newStatus: 'ELIMINATED',
      message: 'Peer verification confirmed AI elimination decision.'
    };
  }
  
  // Between 40-70%
  return {
    decision: 'AI_DECISION_UPHELD',
    newStatus: 'ELIMINATED',
    message: 'AI decision upheld due to lack of clear consensus among reviewers.'
  };
}
```

**Integrity Score Calculation**:

```typescript
async function calculateIntegrityDelta(
  reviewerId: string,
  assignmentId: string,
  decision: string
): Promise<number> {
  const assignment = await getAssignment(assignmentId);
  const submission = await getSubmission(assignment.submission_id);
  
  // Check if this is a control submission
  const isControl = submission.status !== 'PEER_VERIFICATION_PENDING';
  
  if (isControl) {
    // Control submission - compare to AI decision
    const aiDecision = submission.ai_screenings[0].status;
    
    if (
      (aiDecision === 'FAILED' && decision === 'ELIMINATE') ||
      (aiDecision === 'PASSED' && decision === 'REINSTATE')
    ) {
      return 10; // Correct match with AI
    }
    return -5; // Incorrect match with AI
  } else {
    // Verification request - compare to majority
    const voteBreakdown = await aggregateVotes(submission.id);
    const majorityDecision = voteBreakdown.reinstatePercentage > 50 
      ? 'REINSTATE' 
      : 'ELIMINATE';
    
    if (decision === majorityDecision) {
      return 5; // In majority
    } else if (
      (decision === 'REINSTATE' && voteBreakdown.reinstatePercentage < 30) ||
      (decision === 'ELIMINATE' && voteBreakdown.eliminatePercentage < 30)
    ) {
      return -3; // In small minority (<30%)
    }
    
    return 0; // In minority but not extreme
  }
}
```

---

### 6. Deadline Management Service

**Location**: `src/lib/peer-verification/deadline-service.ts`

**Purpose**: Handle expired assignments and send deadline reminders.

**Key Functions**:

```typescript
/**
 * Check for expired assignments and mark them
 */
export async function checkExpiredAssignments(): Promise<void>

/**
 * Reassign expired assignments to new reviewers
 */
async function reassignExpiredAssignments(): Promise<void>

/**
 * Send deadline warning emails (24h before)
 */
export async function sendDeadlineWarnings(): Promise<void>

/**
 * Send final reminder emails (2h before)
 */
export async function sendFinalReminders(): Promise<void>

/**
 * Check for incomplete verifications (>14 days, <8 reviews)
 */
export async function checkIncompleteVerifications(): Promise<void>

/**
 * Process refund for incomplete verification
 */
async function processRefund(submissionId: string): Promise<void>
```

**Cron Job Configuration** (Vercel):

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/peer-verification/check-deadlines",
      "schedule": "0 * * * *"  // Every hour
    },
    {
      "path": "/api/cron/peer-verification/send-warnings",
      "schedule": "0 */6 * * *"  // Every 6 hours
    },
    {
      "path": "/api/cron/peer-verification/check-incomplete",
      "schedule": "0 0 * * *"  // Daily at midnight
    }
  ]
}
```

---

### 7. Results Display Component

**Location**: `src/components/peer-verification/PeerVerificationResults.tsx`

**Purpose**: Display peer verification results on the screening results page.

**UI Structure**:

```tsx
<PeerVerificationResultsSection>
  <ResultsHeader>
    <StatusBadge status={outcome.decision} />
    <CompletionDate date={result.completedAt} />
  </ResultsHeader>
  
  <VoteBreakdownChart>
    <PieChart
      data={[
        { label: 'Reinstate', value: reinstateCount, color: '#2E7D32' },
        { label: 'Eliminate', value: eliminateCount, color: '#C62828' }
      ]}
    />
    <VoteStats>
      <Stat 
        label="Reinstate" 
        value={`${reinstateCount}/10`} 
        percentage={reinstatePercentage} 
      />
      <Stat 
        label="Eliminate" 
        value={`${eliminateCount}/10`} 
        percentage={eliminatePercentage} 
      />
    </VoteStats>
  </VoteBreakdownChart>
  
  <FinalDecision>
    {outcome.decision === 'REINSTATED' && (
      <SuccessMessage>
        <CheckCircle className="w-6 h-6" />
        Your submission has been reinstated! It has re-entered the contest
        in the {currentPhase} phase.
      </SuccessMessage>
    )}
    {outcome.decision === 'ELIMINATED_CONFIRMED' && (
      <FailureMessage>
        <XCircle className="w-6 h-6" />
        Peer verification confirmed the AI elimination decision.
      </FailureMessage>
    )}
    {outcome.decision === 'AI_DECISION_UPHELD' && (
      <NeutralMessage>
        <AlertCircle className="w-6 h-6" />
        AI decision upheld due to lack of clear consensus.
      </NeutralMessage>
    )}
  </FinalDecision>
  
  <ReviewerComments>
    <h3>Reviewer Feedback</h3>
    {comments.map((comment, index) => (
      <CommentCard key={index}>
        <CommentDecision decision={comment.decision} />
        <CommentText>{comment.text}</CommentText>
      </CommentCard>
    ))}
  </ReviewerComments>
</PeerVerificationResultsSection>
```

---

## Data Models

### Database Schema (Already Exists)

The following schema is already in place and supports peer verification:

```sql
-- peer_assignments table
CREATE TABLE peer_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES submissions(id),
  reviewer_user_id UUID NOT NULL REFERENCES users(id),
  status assignment_status DEFAULT 'PENDING',
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  deadline TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

-- peer_reviews table
CREATE TABLE peer_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID UNIQUE NOT NULL REFERENCES peer_assignments(id),
  clarity SMALLINT CHECK (clarity >= 1 AND clarity <= 5),
  argument SMALLINT CHECK (argument >= 1 AND argument <= 5),
  style SMALLINT CHECK (style >= 1 AND style <= 5),
  moral_depth SMALLINT CHECK (moral_depth >= 1 AND moral_depth <= 5),
  comment_100 VARCHAR(100),
  decision TEXT CHECK (decision IN ('ELIMINATE', 'REINSTATE')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- submissions table additions
ALTER TABLE submissions 
ADD COLUMN peer_verification_result JSONB;

-- users table additions
ALTER TABLE users 
ADD COLUMN integrity_score INTEGER DEFAULT 0,
ADD COLUMN qualified_evaluator BOOLEAN DEFAULT FALSE;

-- submission_status enum additions
ALTER TYPE submission_status 
ADD VALUE 'PEER_VERIFICATION_PENDING',
ADD VALUE 'REINSTATED';
```

**Note**: For peer verification, the `clarity`, `argument`, `style`, and `moral_depth` columns in `peer_reviews` can be NULL since we only need `decision` and `comment_100`. These columns are used for normal peer review.

---

## Error Handling

### Assignment Service Errors

1. **Insufficient Reviewers**: If fewer than 10 eligible reviewers, assign all available and log warning
2. **Insufficient Control Submissions**: Use available submissions and log warning
3. **Database Errors**: Rollback transaction and retry up to 3 times
4. **Email Failures**: Log error but don't fail assignment process

### Evaluation Service Errors

1. **Invalid Assignment**: Return 403 if user doesn't own assignment
2. **Expired Assignment**: Return 400 if deadline passed
3. **Duplicate Submission**: Return 400 if review already exists
4. **Rate Limit**: Return 429 if submitted within 10 seconds of last submission

### Results Service Errors

1. **Incomplete Reviews**: Don't calculate until all 10 complete or 14 days pass
2. **Email Failures**: Log error but mark results as complete
3. **Database Errors**: Retry up to 3 times, then mark for manual admin review

---

## Security Considerations

1. **Blind Review Enforcement**: Never expose AI decision, verification status, or author identity in evaluation interface
2. **Assignment Ownership**: Verify reviewer owns assignment before allowing evaluation
3. **Rate Limiting**: Enforce 10-second minimum between submissions (client + server)
4. **Gaming Detection**: Flag reviewers with suspicious patterns (always same vote, always minority)
5. **Admin Audit Trail**: Log all admin actions in audit_logs table
6. **Data Sanitization**: Remove PII from logs and error messages

---

## Performance Considerations

1. **Immediate Processing**: Assignment triggered by webhook, completes within 5 minutes
2. **Async Email Sending**: Queue emails and send asynchronously
3. **Async Results Calculation**: Trigger results calculation asynchronously when last review completes
4. **Database Indexes**: 
   - `peer_assignments(reviewer_user_id, status)`
   - `peer_assignments(submission_id, status)`
   - `peer_assignments(deadline)` for cron jobs
5. **Caching**: Cache eligible reviewer lists for 5 minutes to reduce queries

---

## Monitoring and Observability

**Key Metrics**:
1. **Assignment Metrics**: Time from payment to assignment completion, reviewer distribution
2. **Evaluation Metrics**: Completion rate, average time to complete, expiration rate
3. **Results Metrics**: Outcome distribution (reinstated vs confirmed vs upheld), average vote percentages
4. **Integrity Metrics**: Average integrity scores, flagged reviewer count, qualified evaluator count
5. **Performance Metrics**: Webhook processing time, assignment creation time, results calculation time

**Logging Strategy**:
- Log all assignment creations with reviewer IDs and submission IDs
- Log all evaluation submissions with decision and timestamp
- Log all results calculations with vote breakdown
- Log all integrity score updates with delta values
- Log all expired assignments and reassignments
- Log all refunds for incomplete verifications

---

## Deployment Plan

### Phase 1: Core Infrastructure
1. Deploy immediate assignment service
2. Deploy evaluation service
3. Deploy results service
4. Deploy deadline management service

### Phase 2: UI Components
1. Deploy reviewer dashboard
2. Deploy blind evaluation interface
3. Deploy results display component

### Phase 3: Background Jobs
1. Configure Vercel cron jobs
2. Test deadline checking
3. Test warning emails

### Phase 4: Testing
1. Test with real payment in staging
2. Verify immediate assignment works
3. Test full flow end-to-end
4. Monitor logs for errors

### Phase 5: Production
1. Deploy to production
2. Monitor first few verifications closely
3. Adjust thresholds if needed
