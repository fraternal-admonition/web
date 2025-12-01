# Design Document: Peer Review Phase (Phase 5)

## Overview

The Peer Review Phase is a contest-wide evaluation stage where all submissions that passed AI filtering (SUBMITTED or REINSTATED status) are reviewed by fellow contestants. Each reviewer evaluates 10 randomly assigned submissions using four criteria on a 1-5 scale. The system calculates peer scores using trimmed means to remove outliers, ranks submissions, and selects finalists for public voting. Authors who fail to complete their review obligations are automatically disqualified.

**Key Design Principles:**
1. **Phase-Based Activation**: Triggered manually by admin, not automatic
2. **Balanced Assignment**: Each reviewer gets 10 submissions; distribution is balanced across all submissions
3. **Anonymous Evaluation**: Reviewers never see author identities
4. **Fair Scoring**: Trimmed mean removes outliers for submissions with 5+ reviews
5. **Obligation Enforcement**: Non-completion results in automatic disqualification

## Architecture

### System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│              Admin Triggers PEER_REVIEW Phase                    │
│   (Changes phase dropdown OR clicks "Update to Suggested")      │
│         → PATCH /api/admin/contests/[id] {phase: "PEER_REVIEW"} │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              API Route Intercepts Phase Change                   │
│  - Detects phase changing TO PEER_REVIEW                         │
│  - Calls executePeerReviewAssignments(contestId) asynchronously │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Assignment Service                              │
│  - Identify eligible submissions (SUBMITTED, REINSTATED)         │
│  - Identify eligible reviewers (users with eligible submissions) │
│  - Assign 10 random submissions to each reviewer                 │
│  - Balance assignments across all submissions                    │
│  - Create peer_review_assignments records                        │
│  - Send notification emails                                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Reviewer Dashboard                          │
│  - Display pending assignments with countdown                    │
│  - Show progress (3 of 10 completed)                             │
│  - Show "Start Review" button                                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Anonymous Review Interface                    │
│  - Display submission (code, title, body only)                   │
│  - Collect 4 criteria ratings (1-5 scale)                        │
│  - Collect 100-char comment                                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Review Service                               │
│  - Validate reviewer ownership                                   │
│  - Create peer_review_reviews record                             │
│  - Update assignment status to DONE                              │
│  - Check if all reviews complete for submission                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Scoring Service                            │
│  - Aggregate all reviews for submission                          │
│  - Apply trimmed mean if 5+ reviews                              │
│  - Calculate average of 4 criteria                               │
│  - Store in submissions.score_peer                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Phase End Processing                          │
│  - Check all reviewers' completion status                        │
│  - Disqualify authors with incomplete reviews                    │
│  - Rank submissions by score_peer                                │
│  - Select top N finalists                                        │
│  - Transition to PUBLIC_VOTING phase                             │
└─────────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Backend**: Next.js 15 API Routes (TypeScript)
- **Database**: Supabase (PostgreSQL)
- **Email**: Resend API
- **Frontend**: React 19, Framer Motion, Tailwind CSS
- **Authentication**: Supabase Auth
- **Background Jobs**: Vercel Cron Jobs (for deadline checks and expired assignment handling)

## Phase Trigger Mechanism

### How Peer Review Phase is Activated

The peer review phase is triggered automatically when an admin changes the contest phase to `PEER_REVIEW`. There are two ways an admin can do this:

**Method 1: Phase Dropdown in Contest Edit Form**
- Admin visits `/admin/contests/[id]`
- Selects "Peer Review" from the "Current Phase" dropdown
- Clicks "Save Contest"
- Form submits → `PATCH /api/admin/contests/[id]` with `{ phase: "PEER_REVIEW", ...other fields }`

**Method 2: "Update to Suggested" Button**
- Admin visits `/admin/contests/[id]`
- PhaseStatus component shows suggested phase based on timeline dates
- Admin clicks "Update to Suggested" button
- Button calls → `PATCH /api/admin/contests/[id]` with `{ phase: "PEER_REVIEW" }`

**Implementation in API Route** (`/api/admin/contests/[id]/route.ts`):

```typescript
export async function PATCH(request: Request, { params }: RouteParams) {
  // ... authentication checks ...
  
  const body = await request.json();
  
  // Check if phase is being updated to PEER_REVIEW
  const isChangingToPeerReview = body.phase === 'PEER_REVIEW';
  
  // Get current phase before update
  let oldPhase = null;
  if (isChangingToPeerReview) {
    const { data: currentContest } = await adminSupabase
      .from('contests')
      .select('phase')
      .eq('id', id)
      .single();
    oldPhase = currentContest?.phase;
  }

  // Update contest
  const { data: contest, error } = await adminSupabase
    .from("contests")
    .update(body)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to update contest" }, { status: 500 });
  }

  // If phase changed TO PEER_REVIEW (not if already PEER_REVIEW), trigger assignments
  if (isChangingToPeerReview && oldPhase !== 'PEER_REVIEW') {
    console.log('🚀 Triggering peer review assignments for contest:', id);
    
    // Import and execute assignment service
    const { executePeerReviewAssignments } = await import('@/lib/peer-review/assignment-service');
    
    // Run asynchronously (don't block the response)
    executePeerReviewAssignments(id, 10, 7)
      .then(result => {
        console.log('✅ Peer review assignments created:', result);
      })
      .catch(error => {
        console.error('❌ Error creating peer review assignments:', error);
      });
  }

  return NextResponse.json({ contest });
}
```

**Key Benefits:**
1. **Automatic** - No separate "Start Peer Review" button needed
2. **Non-blocking** - Assignment creation runs async, doesn't slow down UI
3. **Integrated** - Uses existing phase management UI
4. **Safe** - Only triggers when phase actually changes TO peer review
5. **Idempotent** - Won't create duplicate assignments if admin saves form multiple times

## Components and Interfaces

### 1. Database Schema (New Tables)

**Tables**: `peer_review_assignments`, `peer_review_reviews`

```sql
-- peer_review_assignments table
CREATE TABLE peer_review_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  reviewer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'DONE', 'EXPIRED')),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  deadline TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  UNIQUE(submission_id, reviewer_user_id)
);

CREATE INDEX idx_peer_review_assignments_reviewer ON peer_review_assignments(reviewer_user_id, status);
CREATE INDEX idx_peer_review_assignments_submission ON peer_review_assignments(submission_id, status);
CREATE INDEX idx_peer_review_assignments_deadline ON peer_review_assignments(deadline) WHERE status = 'PENDING';

-- peer_review_reviews table
CREATE TABLE peer_review_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID UNIQUE NOT NULL REFERENCES peer_review_assignments(id) ON DELETE CASCADE,
  clarity SMALLINT NOT NULL CHECK (clarity >= 1 AND clarity <= 5),
  argument SMALLINT NOT NULL CHECK (argument >= 1 AND argument <= 5),
  style SMALLINT NOT NULL CHECK (style >= 1 AND style <= 5),
  moral_depth SMALLINT NOT NULL CHECK (moral_depth >= 1 AND moral_depth <= 5),
  comment_100 VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_peer_review_reviews_assignment ON peer_review_reviews(assignment_id);
```

---

### 2. Assignment Service

**Location**: `src/lib/peer-review/assignment-service.ts`

**Purpose**: Create balanced assignments when admin triggers peer review phase.

**Key Functions**:

```typescript
/**
 * Main entry point - called when admin changes phase to PEER_REVIEW
 */
export async function executePeerReviewAssignments(contestId: string): Promise<AssignmentResult>

/**
 * Get eligible submissions (SUBMITTED or REINSTATED)
 */
async function getEligibleSubmissions(contestId: string): Promise<Submission[]>

/**
 * Get eligible reviewers (users with eligible submissions)
 */
async function getEligibleReviewers(contestId: string): Promise<User[]>

/**
 * Create balanced assignments (each reviewer gets 10, balanced across submissions)
 */
async function createBalancedAssignments(
  reviewers: User[],
  submissions: Submission[],
  reviewsPerReviewer: number,
  deadline: Date
): Promise<Assignment[]>

/**
 * Send assignment notification emails
 */
async function notifyReviewers(assignments: Assignment[], reviewers: User[]): Promise<void>
```

**Assignment Algorithm**:

```typescript
/**
 * Balanced Assignment Algorithm
 * 
 * Goal: Each reviewer gets exactly 10 submissions
 * Constraint: No self-review
 * Optimization: Balance review counts across submissions
 * 
 * Algorithm:
 * 1. Create a pool of all possible (reviewer, submission) pairs, excluding self-reviews
 * 2. Shuffle the pool randomly
 * 3. For each reviewer:
 *    a. Select 10 submissions they haven't been assigned yet
 *    b. Prefer submissions with fewer reviews so far (balancing)
 *    c. Create assignments
 * 4. If any reviewer can't get 10 unique submissions, log warning
 */
function createBalancedAssignments(
  reviewers: User[],
  submissions: Submission[],
  reviewsPerReviewer: number
): Assignment[] {
  const assignments: Assignment[] = [];
  const reviewCountPerSubmission = new Map<string, number>();
  
  // Initialize review counts
  submissions.forEach(s => reviewCountPerSubmission.set(s.id, 0));
  
  // For each reviewer
  for (const reviewer of reviewers) {
    // Get submissions they can review (not their own)
    const availableSubmissions = submissions.filter(
      s => s.user_id !== reviewer.id
    );
    
    // Sort by current review count (ascending) for balance
    availableSubmissions.sort((a, b) => {
      const countA = reviewCountPerSubmission.get(a.id) || 0;
      const countB = reviewCountPerSubmission.get(b.id) || 0;
      return countA - countB;
    });
    
    // Assign first 10 (or all available if fewer)
    const toAssign = availableSubmissions.slice(0, reviewsPerReviewer);
    
    for (const submission of toAssign) {
      assignments.push({
        submission_id: submission.id,
        reviewer_user_id: reviewer.id,
        status: 'PENDING',
        deadline: calculateDeadline()
      });
      
      // Increment review count for this submission
      const current = reviewCountPerSubmission.get(submission.id) || 0;
      reviewCountPerSubmission.set(submission.id, current + 1);
    }
  }
  
  return assignments;
}
```

---

### 3. Reviewer Dashboard Component

**Location**: `src/app/dashboard/peer-review-tasks/page.tsx`

**Purpose**: Display assigned peer review tasks to reviewers.

**UI Structure**:

```tsx
<DashboardLayout>
  <PageHeader 
    title="Peer Review Tasks"
    description="Evaluate fellow submissions to help determine finalists"
  />
  
  <ProgressCard
    completed={completedCount}
    total={totalCount}
    deadline={earliestDeadline}
  />
  
  <PendingAssignmentsSection>
    {pendingAssignments.map((assignment, index) => (
      <AssignmentCard
        key={assignment.id}
        number={index + 1}
        submissionCode={assignment.submission.submission_code}
        deadline={assignment.deadline}
        onStartReview={() => navigate(`/peer-review/review/${assignment.id}`)}
      />
    ))}
  </PendingAssignmentsSection>
  
  <CompletedAssignmentsSection>
    {completedAssignments.map((assignment, index) => (
      <CompletedAssignmentCard
        key={assignment.id}
        number={index + 1}
        submissionCode={assignment.submission.submission_code}
        completedAt={assignment.completed_at}
        scores={assignment.peer_review_reviews}
      />
    ))}
  </CompletedAssignmentsSection>
  
  <DisqualificationWarning
    show={pendingCount > 0 && isNearDeadline}
    message="Complete all reviews by the deadline to avoid disqualification"
  />
</DashboardLayout>
```

---

### 4. Anonymous Review Interface Component

**Location**: `src/app/peer-review/review/[assignmentId]/page.tsx`

**Purpose**: Allow reviewers to evaluate submissions anonymously.

**UI Structure**:

```tsx
<ReviewLayout>
  <ReviewHeader
    assignmentNumber={currentIndex + 1}
    totalAssignments={10}
    deadline={assignment.deadline}
  />
  
  <SubmissionDisplay
    submissionCode={submission.submission_code}
    title={submission.title}
    bodyText={submission.body_text}
    // NO author identity, AI scores, or other reviews shown
  />
  
  <AnonymousNotice>
    You are evaluating this submission anonymously. Rate it based solely on the content.
  </AnonymousNotice>
  
  <ReviewForm onSubmit={handleSubmit}>
    <CriteriaRating
      label="Clarity"
      description="How clear and understandable is the writing?"
      value={clarity}
      onChange={setClarity}
      min={1}
      max={5}
    />
    
    <CriteriaRating
      label="Argument"
      description="How strong and well-supported is the argument?"
      value={argument}
      onChange={setArgument}
      min={1}
      max={5}
    />
    
    <CriteriaRating
      label="Style"
      description="How engaging and effective is the writing style?"
      value={style}
      onChange={setStyle}
      min={1}
      max={5}
    />
    
    <CriteriaRating
      label="Moral Depth"
      description="How profound is the moral or philosophical insight?"
      value={moralDepth}
      onChange={setMoralDepth}
      min={1}
      max={5}
    />
    
    <CommentField
      maxLength={100}
      value={comment}
      onChange={setComment}
      placeholder="Brief feedback for the author (max 100 characters)"
      required
    />
    
    <SubmitButton 
      disabled={!allCriteriaRated || !comment || isSubmitting}
    >
      {isSubmitting ? 'Submitting...' : 'Submit Review'}
    </SubmitButton>
  </ReviewForm>
</ReviewLayout>
```

---

### 5. Review Service

**Location**: `src/lib/peer-review/review-service.ts`

**Purpose**: Process and store reviews, trigger score calculation.

**Key Functions**:

```typescript
/**
 * Submit a peer review
 */
export async function submitReview(
  assignmentId: string,
  reviewerId: string,
  scores: {
    clarity: number;
    argument: number;
    style: number;
    moral_depth: number;
  },
  comment: string
): Promise<void>

/**
 * Validate review submission
 */
async function validateReview(
  assignmentId: string,
  reviewerId: string
): Promise<{ valid: boolean; error?: string }>

/**
 * Check if all reviews complete for a submission
 */
async function checkSubmissionReviewCompletion(
  submissionId: string
): Promise<{ complete: boolean; reviewCount: number }>

/**
 * Trigger score calculation if all reviews complete
 */
async function triggerScoreCalculation(submissionId: string): Promise<void>
```

**API Route**: `/api/peer-review/submit`

```typescript
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const { assignment_id, clarity, argument, style, moral_depth, comment } = await request.json();
  
  // Validate
  const validation = await validateReview(assignment_id, user.id);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 403 });
  }
  
  // Validate scores are 1-5
  if ([clarity, argument, style, moral_depth].some(s => s < 1 || s > 5)) {
    return NextResponse.json({ error: 'Scores must be between 1 and 5' }, { status: 400 });
  }
  
  // Submit review
  await submitReview(assignment_id, user.id, { clarity, argument, style, moral_depth }, comment);
  
  // Check if all reviews complete for this submission
  const assignment = await getAssignment(assignment_id);
  const completion = await checkSubmissionReviewCompletion(assignment.submission_id);
  
  if (completion.complete) {
    // Trigger score calculation asynchronously
    triggerScoreCalculation(assignment.submission_id).catch(console.error);
  }
  
  return NextResponse.json({ success: true, completion });
}
```

---

### 6. Scoring Service

**Location**: `src/lib/peer-review/scoring-service.ts`

**Purpose**: Calculate peer scores using trimmed mean.

**Key Functions**:

```typescript
/**
 * Calculate peer score for a submission
 */
export async function calculatePeerScore(submissionId: string): Promise<number>

/**
 * Get all reviews for a submission
 */
async function getReviews(submissionId: string): Promise<Review[]>

/**
 * Calculate trimmed mean for a criterion
 */
function calculateTrimmedMean(values: number[]): number {
  if (values.length < 5) {
    // Simple mean for fewer than 5 reviews
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }
  
  // Sort and remove highest and lowest
  const sorted = [...values].sort((a, b) => a - b);
  const trimmed = sorted.slice(1, -1);
  
  return trimmed.reduce((sum, v) => sum + v, 0) / trimmed.length;
}

/**
 * Calculate average of four criteria
 */
function calculateOverallScore(
  clarity: number,
  argument: number,
  style: number,
  moralDepth: number
): number {
  return (clarity + argument + style + moralDepth) / 4;
}
```

**Scoring Logic**:

```typescript
async function calculatePeerScore(submissionId: string): Promise<number> {
  // Get all completed reviews
  const reviews = await getReviews(submissionId);
  
  if (reviews.length === 0) {
    return 0;
  }
  
  // Extract scores for each criterion
  const clarityScores = reviews.map(r => r.clarity);
  const argumentScores = reviews.map(r => r.argument);
  const styleScores = reviews.map(r => r.style);
  const moralDepthScores = reviews.map(r => r.moral_depth);
  
  // Calculate trimmed mean for each criterion
  const clarityMean = calculateTrimmedMean(clarityScores);
  const argumentMean = calculateTrimmedMean(argumentScores);
  const styleMean = calculateTrimmedMean(styleScores);
  const moralDepthMean = calculateTrimmedMean(moralDepthScores);
  
  // Calculate overall score (average of 4 criteria)
  const overallScore = calculateOverallScore(
    clarityMean,
    argumentMean,
    styleMean,
    moralDepthMean
  );
  
  // Store in submissions.score_peer
  await updateSubmissionScore(submissionId, overallScore);
  
  return overallScore;
}
```

---

### 7. Phase End Processing Service

**Location**: `src/lib/peer-review/phase-end-service.ts`

**Purpose**: Handle phase completion, disqualifications, finalist selection.

**Key Functions**:

```typescript
/**
 * Process phase end (called when admin ends peer review phase)
 */
export async function processPeerReviewPhaseEnd(contestId: string): Promise<void>

/**
 * Check and disqualify reviewers with incomplete obligations
 */
async function enforceReviewObligations(contestId: string): Promise<string[]>

/**
 * Finalize all peer scores
 */
async function finalizeAllScores(contestId: string): Promise<void>

/**
 * Select finalists (top N by peer score)
 */
async function selectFinalists(contestId: string, topN: number): Promise<Submission[]>

/**
 * Transition contest to PUBLIC_VOTING phase
 */
async function transitionToPublicVoting(contestId: string): Promise<void>
```

**Phase End Logic**:

```typescript
async function processPeerReviewPhaseEnd(contestId: string): Promise<void> {
  console.log('=== PROCESSING PEER REVIEW PHASE END ===');
  
  // 1. Enforce review obligations (disqualify non-completers)
  const disqualifiedUserIds = await enforceReviewObligations(contestId);
  console.log(`Disqualified ${disqualifiedUserIds.length} users for incomplete reviews`);
  
  // 2. Finalize all peer scores
  await finalizeAllScores(contestId);
  console.log('All peer scores finalized');
  
  // 3. Get finalist configuration
  const config = await getFinalistConfig(contestId);
  const topN = config.finalist_count || 100;
  
  // 4. Select finalists
  const finalists = await selectFinalists(contestId, topN);
  console.log(`Selected ${finalists.length} finalists`);
  
  // 5. Transition to public voting
  await transitionToPublicVoting(contestId);
  console.log('Transitioned to PUBLIC_VOTING phase');
  
  // 6. Send notifications
  await notifyFinalists(finalists);
  await notifyDisqualified(disqualifiedUserIds);
  
  console.log('=== PEER REVIEW PHASE END COMPLETE ===');
}
```

---

### 8. Results Display Component

**Location**: `src/components/peer-review/PeerReviewResults.tsx`

**Purpose**: Display peer review results to authors (when enabled by admin).

**UI Structure**:

```tsx
<PeerReviewResultsSection>
  <ResultsHeader>
    <ScoreBadge score={peerScore} maxScore={5} />
    <RankBadge rank={rank} totalSubmissions={total} />
  </ResultsHeader>
  
  <CriteriaBreakdown>
    <CriterionScore
      label="Clarity"
      score={clarityMean}
      maxScore={5}
    />
    <CriterionScore
      label="Argument"
      score={argumentMean}
      maxScore={5}
    />
    <CriterionScore
      label="Style"
      score={styleMean}
      maxScore={5}
    />
    <CriterionScore
      label="Moral Depth"
      score={moralDepthMean}
      maxScore={5}
    />
  </CriteriaBreakdown>
  
  <ReviewStats>
    <Stat label="Reviews Received" value={reviewCount} />
    <Stat label="Overall Score" value={peerScore.toFixed(2)} />
  </ReviewStats>
  
  <ReviewerComments>
    <h3>Reviewer Feedback</h3>
    {comments.map((comment, index) => (
      <CommentCard key={index}>
        <CommentText>{comment}</CommentText>
        <CommentMeta>Reviewer {index + 1}</CommentMeta>
      </CommentCard>
    ))}
  </ReviewerComments>
</PeerReviewResultsSection>
```

---

### 9. Admin Dashboard Component

**Location**: `src/app/admin/peer-review/page.tsx`

**Purpose**: Monitor peer review progress and manage the phase.

**UI Structure**:

```tsx
<AdminLayout>
  <PageHeader 
    title="Peer Review Management"
    description="Monitor progress and manage peer review phase"
  />
  
  <StatisticsGrid>
    <StatCard
      label="Total Assignments"
      value={totalAssignments}
    />
    <StatCard
      label="Completed Reviews"
      value={completedReviews}
      percentage={completionRate}
    />
    <StatCard
      label="Pending Reviews"
      value={pendingReviews}
    />
    <StatCard
      label="At-Risk Reviewers"
      value={atRiskCount}
      variant="warning"
    />
  </StatisticsGrid>
  
  <ConfigurationPanel>
    <DeadlineConfig
      currentDeadline={deadline}
      onUpdate={handleDeadlineUpdate}
    />
    <FinalistCountConfig
      currentCount={finalistCount}
      onUpdate={handleFinalistCountUpdate}
    />
    <ResultsVisibilityToggle
      enabled={resultsVisible}
      onToggle={handleVisibilityToggle}
    />
  </ConfigurationPanel>
  
  <ReviewerActivityTable
    reviewers={reviewers}
    onReassign={handleReassign}
  />
  
  <SubmissionReviewTable
    submissions={submissions}
    onViewDetails={handleViewDetails}
  />
  
  <PhaseEndButton
    onClick={handlePhaseEnd}
    disabled={!canEndPhase}
  >
    End Peer Review Phase & Select Finalists
  </PhaseEndButton>
</AdminLayout>
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Eligible Submission Selection

*For any* contest, when identifying eligible submissions for peer review, the system should include all and only submissions with status SUBMITTED or REINSTATED.

**Validates: Requirements 1.2, 1.3, 1.4**

### Property 2: Eligible Reviewer Selection

*For any* contest, when identifying eligible reviewers, the system should include all and only users who have at least one submission with status SUBMITTED or REINSTATED.

**Validates: Requirements 1.5**

### Property 3: Assignment Count Per Reviewer

*For any* reviewer in the system, after assignment creation completes, that reviewer should have exactly 10 peer_review_assignments (or fewer if insufficient submissions exist).

**Validates: Requirements 3.1**

### Property 4: No Self-Review

*For any* peer_review_assignment in the system, the reviewer_user_id should never equal the submission's user_id.

**Validates: Requirements 3.3**

### Property 5: Initial Assignment Status

*For any* newly created peer_review_assignment, the status should be PENDING.

**Validates: Requirements 3.4**

### Property 6: Deadline Calculation

*For any* peer_review_assignment, the deadline should be exactly N days after assigned_at, where N is the configured deadline duration.

**Validates: Requirements 3.5**

### Property 7: Balanced Review Distribution

*For any* contest after assignment creation, the difference between the maximum and minimum number of reviews per submission should be minimized (ideally 0 or 1).

**Validates: Requirements 4.1, 4.2, 4.3**

### Property 8: Review Data Completeness

*For any* peer_review_review record, all four criteria (clarity, argument, style, moral_depth) and comment_100 should be non-null and valid.

**Validates: Requirements 10.4**

### Property 9: Assignment State Transition

*For any* peer_review_assignment, when a review is successfully submitted, the status should change from PENDING to DONE and completed_at should be set.

**Validates: Requirements 10.5**

### Property 10: Score Calculation Trigger

*For any* submission, when all assigned reviews are completed, the score_peer should be calculated and stored.

**Validates: Requirements 13.1**

### Property 11: Trimmed Mean for Large Samples

*For any* submission with 5 or more reviews, the peer score calculation should exclude the highest and lowest score for each criterion before averaging.

**Validates: Requirements 13.2**

### Property 12: Simple Mean for Small Samples

*For any* submission with fewer than 5 reviews, the peer score calculation should include all scores in the average.

**Validates: Requirements 13.3**

### Property 13: Four-Criteria Average

*For any* submission, the peer score should equal the average of the four criterion means (clarity, argument, style, moral_depth).

**Validates: Requirements 13.4**

### Property 14: Score Persistence

*For any* submission after peer score calculation, the score_peer column should contain the calculated value.

**Validates: Requirements 13.5**

---

## Data Models

### TypeScript Interfaces

```typescript
export interface PeerReviewAssignment {
  id: string;
  submission_id: string;
  reviewer_user_id: string;
  status: 'PENDING' | 'DONE' | 'EXPIRED';
  assigned_at: string;
  completed_at: string | null;
  deadline: string;
}

export interface PeerReviewReview {
  id: string;
  assignment_id: string;
  clarity: number; // 1-5
  argument: number; // 1-5
  style: number; // 1-5
  moral_depth: number; // 1-5
  comment_100: string;
  created_at: string;
}

export interface PeerReviewStats {
  total_assignments: number;
  completed_reviews: number;
  pending_reviews: number;
  completion_rate: number;
  at_risk_reviewers: number;
}

export interface ReviewerProgress {
  user_id: string;
  display_id: string;
  total_assigned: number;
  completed: number;
  pending: number;
  completion_rate: number;
  at_risk: boolean;
}
```

---

## Error Handling

### Assignment Service Errors

1. **Insufficient Reviewers**: If fewer reviewers than needed, assign all available and log warning
2. **Insufficient Submissions**: If fewer than 10 submissions per reviewer, assign all available
3. **Database Errors**: Rollback transaction and retry up to 3 times
4. **Email Failures**: Log error but don't fail assignment process

### Review Service Errors

1. **Invalid Assignment**: Return 403 if user doesn't own assignment
2. **Expired Assignment**: Return 400 if deadline passed
3. **Duplicate Review**: Return 400 if review already exists
4. **Invalid Scores**: Return 400 if scores not between 1-5

### Scoring Service Errors

1. **No Reviews**: Return score of 0 if no reviews exist
2. **Incomplete Reviews**: Don't calculate until all expected reviews complete
3. **Database Errors**: Retry up to 3 times, then log for manual review

---

## Security Considerations

1. **Anonymous Review Enforcement**: Never expose author identity in review interface
2. **Assignment Ownership**: Verify reviewer owns assignment before allowing review
3. **Admin Authorization**: Verify admin role for all admin operations
4. **Data Sanitization**: Remove PII from logs and error messages
5. **Audit Trail**: Log all admin actions (reassignments, overrides, phase changes)

---

## Performance Considerations

1. **Batch Assignment Creation**: Create all assignments in batches of 100 to avoid timeouts
2. **Async Email Sending**: Queue emails and send asynchronously
3. **Async Score Calculation**: Trigger score calculation asynchronously when reviews complete
4. **Database Indexes**: 
   - `peer_review_assignments(reviewer_user_id, status)`
   - `peer_review_assignments(submission_id, status)`
   - `peer_review_assignments(deadline)` for cron jobs
5. **Caching**: Cache eligible reviewer/submission lists during assignment creation

---

## Monitoring and Observability

**Key Metrics**:
1. **Assignment Metrics**: Time to create assignments, distribution balance
2. **Review Metrics**: Completion rate, average time to complete, expiration rate
3. **Scoring Metrics**: Score distribution, outlier frequency
4. **Disqualification Metrics**: Disqualification rate, reasons
5. **Performance Metrics**: Assignment creation time, score calculation time

**Logging Strategy**:
- Log all assignment creations with counts and distribution
- Log all review submissions with scores and timestamp
- Log all score calculations with values
- Log all disqualifications with reasons
- Log all phase transitions with timestamp

---

## Deployment Plan

### Phase 1: Database Setup
1. Create peer_review_assignments and peer_review_reviews tables via Supabase migration
2. Add indexes for performance
3. Test constraints and foreign keys

### Phase 2: Core Services
1. Deploy assignment service
2. Deploy review service
3. Deploy scoring service
4. Deploy phase end service

### Phase 3: UI Components
1. Deploy reviewer dashboard
2. Deploy review interface
3. Deploy results display
4. Deploy admin dashboard

### Phase 4: Background Jobs
1. Configure Vercel cron jobs for deadline checks
2. Test expired assignment handling
3. Test reminder emails

### Phase 5: Testing
1. Test with small contest (10 submissions, 10 reviewers)
2. Test with medium contest (100 submissions, 100 reviewers)
3. Test disqualification logic
4. Test finalist selection
5. Monitor logs for errors

### Phase 6: Production
1. Deploy to production
2. Monitor first peer review phase closely
3. Adjust configuration as needed
