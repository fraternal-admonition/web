import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * Vote breakdown for a verification request
 */
export interface VoteBreakdown {
  total: number;
  eliminate: number;
  reinstate: number;
  eliminatePercentage: number;
  reinstatePercentage: number;
  completedAt: string;
}

/**
 * Verification outcome
 */
export interface VerificationOutcome {
  decision: 'REINSTATED' | 'ELIMINATED_CONFIRMED' | 'AI_DECISION_UPHELD';
  newStatus: 'REINSTATED' | 'ELIMINATED';
  message: string;
}

/**
 * Calculate results for a verification request
 * This is the main entry point called when all reviews are complete
 */
export async function calculateResults(submissionId: string): Promise<void> {
  console.log('=== CALCULATING RESULTS ===');
  console.log('Submission ID:', submissionId);

  try {
    // Aggregate votes
    const voteBreakdown = await aggregateVotes(submissionId);
    console.log('Vote breakdown:', voteBreakdown);

    // Determine outcome
    const outcome = determineOutcome(voteBreakdown);
    console.log('Outcome:', outcome);

    // Update submission status
    await updateSubmissionStatus(submissionId, outcome, voteBreakdown);
    console.log('Submission status updated');

    // Update integrity scores for all reviewers
    await updateIntegrityScores(submissionId, voteBreakdown);
    console.log('Integrity scores updated');

    // Send notification email to author
    await notifyAuthor(submissionId, outcome, voteBreakdown);
    console.log('Author notified');

    console.log('=== RESULTS CALCULATION COMPLETE ===');
  } catch (error) {
    console.error('Error calculating results:', error);
    throw error;
  }
}

/**
 * Aggregate votes from all reviewers for a submission
 */
export async function aggregateVotes(submissionId: string): Promise<VoteBreakdown> {
  const supabase = await createAdminClient();

  // Get all peer reviews for this submission
  const { data: assignments, error } = await supabase
    .from('peer_assignments')
    .select(`
      id,
      status,
      peer_reviews (
        decision
      )
    `)
    .eq('submission_id', submissionId)
    .eq('status', 'DONE');

  if (error) {
    throw new Error('Failed to fetch reviews: ' + error.message);
  }

  if (!assignments || assignments.length === 0) {
    throw new Error('No completed reviews found for submission');
  }

  // Count votes
  let eliminateCount = 0;
  let reinstateCount = 0;

  for (const assignment of assignments) {
    // peer_reviews might be an array or a single object depending on the relationship
    const reviewsData = assignment.peer_reviews as any;
    let decision: string | undefined;

    if (Array.isArray(reviewsData)) {
      if (reviewsData.length > 0) {
        decision = reviewsData[0].decision;
      }
    } else if (reviewsData) {
      decision = reviewsData.decision;
    }

    if (decision === 'ELIMINATE') {
      eliminateCount++;
    } else if (decision === 'REINSTATE') {
      reinstateCount++;
    }
  }

  const total = eliminateCount + reinstateCount;
  const eliminatePercentage = total > 0 ? (eliminateCount / total) * 100 : 0;
  const reinstatePercentage = total > 0 ? (reinstateCount / total) * 100 : 0;

  return {
    total,
    eliminate: eliminateCount,
    reinstate: reinstateCount,
    eliminatePercentage: Math.round(eliminatePercentage * 10) / 10, // Round to 1 decimal
    reinstatePercentage: Math.round(reinstatePercentage * 10) / 10,
    completedAt: new Date().toISOString(),
  };
}

/**
 * Determine outcome based on vote percentages
 */
export function determineOutcome(votes: VoteBreakdown): VerificationOutcome {
  if (votes.reinstatePercentage >= 70) {
    return {
      decision: 'REINSTATED',
      newStatus: 'REINSTATED',
      message: 'Peer verification overturned AI elimination. Your submission has been reinstated.',
    };
  }

  if (votes.eliminatePercentage >= 70) {
    return {
      decision: 'ELIMINATED_CONFIRMED',
      newStatus: 'ELIMINATED',
      message: 'Peer verification confirmed AI elimination decision.',
    };
  }

  // Between 40-70% for either decision
  return {
    decision: 'AI_DECISION_UPHELD',
    newStatus: 'ELIMINATED',
    message: 'AI decision upheld due to lack of clear consensus among reviewers.',
  };
}

/**
 * Update submission status based on outcome
 */
export async function updateSubmissionStatus(
  submissionId: string,
  outcome: VerificationOutcome,
  voteBreakdown: VoteBreakdown
): Promise<void> {
  const adminSupabase = await createAdminClient();

  // Prepare the peer_verification_result data
  const resultData = {
    decision: outcome.decision,
    total_votes: voteBreakdown.total,
    eliminate_votes: voteBreakdown.eliminate,
    reinstate_votes: voteBreakdown.reinstate,
    eliminate_percentage: voteBreakdown.eliminatePercentage,
    reinstate_percentage: voteBreakdown.reinstatePercentage,
    completed_at: voteBreakdown.completedAt,
    message: outcome.message,
  };

  // Update submission
  const { error } = await adminSupabase
    .from('submissions')
    .update({
      status: outcome.newStatus,
      peer_verification_result: resultData,
    })
    .eq('id', submissionId);

  if (error) {
    throw new Error('Failed to update submission status: ' + error.message);
  }

  console.log('Submission updated:', {
    submissionId,
    newStatus: outcome.newStatus,
    decision: outcome.decision,
  });

  // If reinstated, handle phase re-entry
  if (outcome.newStatus === 'REINSTATED') {
    await handleReinstatedSubmission(submissionId);
  }
}

/**
 * Handle reinstated submission - put it back into current contest phase
 */
async function handleReinstatedSubmission(submissionId: string): Promise<void> {
  const adminSupabase = await createAdminClient();

  // Get the submission's contest
  const { data: submission } = await adminSupabase
    .from('submissions')
    .select('contest_id')
    .eq('id', submissionId)
    .single();

  if (!submission) {
    console.error('Submission not found for phase handling');
    return;
  }

  // Get current contest phase
  const { data: contest } = await adminSupabase
    .from('contests')
    .select('current_phase')
    .eq('id', submission.contest_id)
    .single();

  if (!contest) {
    console.error('Contest not found for phase handling');
    return;
  }

  console.log('Reinstated submission phase handling:', {
    submissionId,
    contestId: submission.contest_id,
    currentPhase: contest.current_phase,
  });

  // Note: The submission status is already set to REINSTATED
  // The contest phase manager will handle including it in the appropriate phase
  // For now, we just log this information
}


/**
 * Calculate integrity score delta for a single reviewer on a single assignment
 */
async function calculateIntegrityDelta(
  reviewerId: string,
  assignmentId: string,
  decision: string,
  submissionId: string,
  voteBreakdown: VoteBreakdown
): Promise<number> {
  const supabase = await createAdminClient();

  // Get the submission to check if it's a control or verification request
  const { data: submission } = await supabase
    .from('submissions')
    .select('status, user_id')
    .eq('id', submissionId)
    .single();

  if (!submission) {
    console.error('Submission not found for integrity calculation');
    return 0;
  }

  // Check if this is a control submission
  const isControl = submission.status !== 'PEER_VERIFICATION_PENDING';

  if (isControl) {
    // Control submission - compare to AI decision
    // Get AI screening result
    const { data: aiScreening } = await supabase
      .from('ai_screenings')
      .select('status')
      .eq('submission_id', submissionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!aiScreening) {
      console.error('AI screening not found for control submission');
      return 0;
    }

    const aiDecision = aiScreening.status;

    // Match AI decision: +10 points
    // Mismatch AI decision: -5 points
    if (
      (aiDecision === 'FAILED' && decision === 'ELIMINATE') ||
      (aiDecision === 'PASSED' && decision === 'REINSTATE')
    ) {
      console.log(`Reviewer ${reviewerId}: Matched AI decision on control (+10)`);
      return 10;
    } else {
      console.log(`Reviewer ${reviewerId}: Mismatched AI decision on control (-5)`);
      return -5;
    }
  } else {
    // Verification request - compare to majority vote
    const majorityDecision =
      voteBreakdown.reinstatePercentage > 50 ? 'REINSTATE' : 'ELIMINATE';

    if (decision === majorityDecision) {
      // In majority: +5 points
      console.log(`Reviewer ${reviewerId}: In majority on verification (+5)`);
      return 5;
    } else {
      // In minority - check if extreme minority (<30%)
      const reviewerPercentage =
        decision === 'REINSTATE'
          ? voteBreakdown.reinstatePercentage
          : voteBreakdown.eliminatePercentage;

      if (reviewerPercentage < 30) {
        // Small minority: -3 points
        console.log(
          `Reviewer ${reviewerId}: In small minority on verification (-3)`
        );
        return -3;
      } else {
        // Minority but not extreme: 0 points
        console.log(
          `Reviewer ${reviewerId}: In minority but not extreme on verification (0)`
        );
        return 0;
      }
    }
  }
}

/**
 * Update integrity scores for all reviewers who evaluated this submission
 */
async function updateIntegrityScores(
  submissionId: string,
  voteBreakdown: VoteBreakdown
): Promise<void> {
  const supabase = await createClient();
  const adminSupabase = await createAdminClient();

  console.log('Updating integrity scores for submission:', submissionId);

  // Get all assignments for this submission with their reviews
  const { data: assignments, error } = await supabase
    .from('peer_assignments')
    .select(
      `
      id,
      reviewer_user_id,
      submission_id,
      peer_reviews (
        decision
      )
    `
    )
    .eq('submission_id', submissionId)
    .eq('status', 'DONE');

  if (error || !assignments) {
    console.error('Error fetching assignments for integrity scoring:', error);
    return;
  }

  // Calculate and update score for each reviewer
  for (const assignment of assignments) {
    const reviewsData = assignment.peer_reviews as any;
    let decision: string | undefined;

    if (Array.isArray(reviewsData)) {
      if (reviewsData.length > 0) {
        decision = reviewsData[0].decision;
      }
    } else if (reviewsData) {
      decision = reviewsData.decision;
    }

    if (!decision) {
      continue;
    }
    const reviewerId = assignment.reviewer_user_id;

    // Calculate integrity delta
    const delta = await calculateIntegrityDelta(
      reviewerId,
      assignment.id,
      decision,
      assignment.submission_id,
      voteBreakdown
    );

    // Update user's integrity score
    const { data: currentUser } = await supabase
      .from('users')
      .select('integrity_score')
      .eq('id', reviewerId)
      .single();

    const currentScore = currentUser?.integrity_score || 0;
    const newScore = currentScore + delta;

    const { error: updateError } = await adminSupabase
      .from('users')
      .update({ integrity_score: newScore })
      .eq('id', reviewerId);

    if (updateError) {
      console.error(
        `Error updating integrity score for reviewer ${reviewerId}:`,
        updateError
      );
    } else {
      console.log(
        `Reviewer ${reviewerId}: Score ${currentScore} → ${newScore} (${delta >= 0 ? '+' : ''}${delta})`
      );
    }

    // Check and update qualified evaluator status
    await checkQualifiedEvaluatorStatus(reviewerId);
  }
}

/**
 * Check and grant/revoke Qualified Evaluator status
 */
async function checkQualifiedEvaluatorStatus(reviewerId: string): Promise<void> {
  const supabase = await createAdminClient();
  const adminSupabase = supabase;

  // Get user's current status and score
  const { data: user } = await supabase
    .from('users')
    .select('integrity_score, qualified_evaluator')
    .eq('id', reviewerId)
    .single();

  if (!user) {
    return;
  }

  // Count completed assignments
  const { data: completedAssignments } = await supabase
    .from('peer_assignments')
    .select('id')
    .eq('reviewer_user_id', reviewerId)
    .eq('status', 'DONE');

  const completedCount = completedAssignments?.length || 0;

  // Grant status if: 3+ completed assignments AND integrity_score >= 0
  const shouldBeQualified = completedCount >= 3 && user.integrity_score >= 0;

  // Update if status changed
  if (shouldBeQualified !== user.qualified_evaluator) {
    const { error } = await adminSupabase
      .from('users')
      .update({ qualified_evaluator: shouldBeQualified })
      .eq('id', reviewerId);

    if (!error) {
      if (shouldBeQualified) {
        console.log(
          `Reviewer ${reviewerId}: Granted Qualified Evaluator status`
        );
        // TODO: Send congratulatory email (task 16.3)
      } else {
        console.log(
          `Reviewer ${reviewerId}: Revoked Qualified Evaluator status`
        );
      }
    }
  }

  // Flag for admin review if score drops below -20
  if (user.integrity_score < -20) {
    console.log(
      `Reviewer ${reviewerId}: Integrity score below -20, should be flagged for admin review`
    );
    // TODO: Create flag in flags table (task 14.4)
  }
}


/**
 * Send results notification email to submission author
 */
async function notifyAuthor(
  submissionId: string,
  outcome: VerificationOutcome,
  voteBreakdown: VoteBreakdown
): Promise<void> {
  const supabase = await createClient();

  // Get submission details and author email
  const { data: submission } = await supabase
    .from('submissions')
    .select(
      `
      submission_code,
      title,
      contest_id,
      users:user_id (
        email
      )
    `
    )
    .eq('id', submissionId)
    .single();

  if (!submission) {
    console.error('Submission not found for notification');
    return;
  }

  // Get contest phase
  const { data: contest } = await supabase
    .from('contests')
    .select('current_phase')
    .eq('id', submission.contest_id)
    .single();

  const currentPhase = contest?.current_phase;

  // Extract email from users relationship
  const users = submission.users as any;
  const authorEmail = Array.isArray(users) ? users[0]?.email : users?.email;

  if (!authorEmail) {
    console.error('Author email not found for notification');
    return;
  }

  // Construct results URL
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const resultsUrl = `${siteUrl}/contest/screening-results/${submissionId}`;

  // Send email
  const { sendVerificationCompleteEmail } = await import('@/lib/email');

  try {
    await sendVerificationCompleteEmail(
      authorEmail,
      submission.submission_code,
      submission.title,
      outcome.decision,
      voteBreakdown.reinstate,
      voteBreakdown.eliminate,
      voteBreakdown.total,
      outcome.message,
      resultsUrl,
      currentPhase
    );

    console.log('Verification complete email sent to:', authorEmail);
  } catch (error) {
    console.error('Error sending verification complete email:', error);
    // Don't throw - email failure shouldn't fail the results calculation
  }
}
