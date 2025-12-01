/**
 * Peer Review Phase 5 - Phase End Processing Service
 * 
 * This service handles the completion of the peer review phase, including:
 * - Enforcing review obligations (disqualifying non-completers)
 * - Finalizing all peer scores
 * - Selecting finalists based on peer scores
 * - Transitioning contest to PUBLIC_VOTING phase
 * - Sending notification emails
 * 
 * This is called when an admin manually ends the peer review phase.
 */

import { createClient } from '@/lib/supabase/server';
import { calculatePeerScore } from './scoring-service';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface PhaseEndResult {
  success: boolean;
  disqualifiedCount: number;
  disqualifiedUserIds: string[];
  finalistsCount: number;
  finalistSubmissionIds: string[];
  scoresFinalized: number;
  errors: string[];
}

export interface ReviewerCompletionStatus {
  user_id: string;
  display_id: string;
  submission_id: string;
  total_assigned: number;
  completed: number;
  completion_rate: number;
  should_disqualify: boolean;
}

export interface FinalistSubmission {
  id: string;
  submission_code: string;
  user_id: string;
  score_peer: number;
  rank: number;
}

// ============================================================================
// Main Function
// ============================================================================

/**
 * Process peer review phase end
 * 
 * This is the main entry point called when an admin ends the peer review phase.
 * It orchestrates all the phase-end operations in the correct order.
 * 
 * @param contestId - UUID of the contest
 * @returns Result object with counts and any errors
 */
export async function processPeerReviewPhaseEnd(
  contestId: string
): Promise<PhaseEndResult> {
  console.log('=== PROCESSING PEER REVIEW PHASE END ===');
  console.log(`Contest ID: ${contestId}`);
  
  const result: PhaseEndResult = {
    success: true,
    disqualifiedCount: 0,
    disqualifiedUserIds: [],
    finalistsCount: 0,
    finalistSubmissionIds: [],
    scoresFinalized: 0,
    errors: []
  };

  try {
    // 1. Finalize all peer scores (do this first to ensure all scores are calculated)
    console.log('\n1. Finalizing all peer scores...');
    const scoresFinalized = await finalizeAllScores(contestId);
    result.scoresFinalized = scoresFinalized;
    console.log(`   ✓ Finalized ${scoresFinalized} peer scores`);

    // 2. Enforce review obligations (disqualify non-completers)
    console.log('\n2. Enforcing review obligations...');
    const disqualifiedUserIds = await enforceReviewObligations(contestId);
    result.disqualifiedCount = disqualifiedUserIds.length;
    result.disqualifiedUserIds = disqualifiedUserIds;
    console.log(`   ✓ Disqualified ${disqualifiedUserIds.length} users for incomplete reviews`);

    // 3. Select finalists
    console.log('\n3. Selecting finalists...');
    const finalists = await selectFinalists(contestId);
    result.finalistsCount = finalists.length;
    result.finalistSubmissionIds = finalists.map(f => f.id);
    console.log(`   ✓ Selected ${finalists.length} finalists`);

    // 4. Transition to PUBLIC_VOTING phase
    console.log('\n4. Transitioning to PUBLIC_VOTING phase...');
    await transitionToPublicVoting(contestId);
    console.log(`   ✓ Contest phase updated to PUBLIC_VOTING`);

    // 5. Send notification emails (async, don't block)
    console.log('\n5. Sending notification emails...');
    sendNotificationEmails(contestId, disqualifiedUserIds, finalists)
      .then(() => console.log('   ✓ Notification emails sent'))
      .catch(err => console.error('   ⚠️  Error sending emails:', err));

    console.log('\n=== PEER REVIEW PHASE END COMPLETE ===\n');
    
    return result;
  } catch (error) {
    console.error('❌ Error in processPeerReviewPhaseEnd:', error);
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    return result;
  }
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Enforce review obligations
 * 
 * Checks each reviewer's completion status and disqualifies those who
 * haven't completed all their assigned reviews.
 * 
 * @param contestId - UUID of the contest
 * @returns Array of disqualified user IDs
 */
export async function enforceReviewObligations(
  contestId: string
): Promise<string[]> {
  const supabase = await createClient();
  const disqualifiedUserIds: string[] = [];

  try {
    // Get all reviewers for this contest (users with assignments)
    const { data: assignments, error: assignmentsError } = await supabase
      .from('peer_review_assignments')
      .select(`
        reviewer_user_id,
        status,
        submission_id,
        submissions!inner(contest_id, user_id)
      `)
      .eq('submissions.contest_id', contestId);

    if (assignmentsError) {
      console.error('Error fetching assignments:', assignmentsError);
      throw assignmentsError;
    }

    if (!assignments || assignments.length === 0) {
      console.log('   No assignments found for contest');
      return [];
    }

    // Group by reviewer and calculate completion status
    const reviewerStats = new Map<string, ReviewerCompletionStatus>();

    for (const assignment of assignments) {
      const userId = assignment.reviewer_user_id;
      
      if (!reviewerStats.has(userId)) {
        reviewerStats.set(userId, {
          user_id: userId,
          display_id: '', // Will be filled later
          submission_id: '', // Will be filled later
          total_assigned: 0,
          completed: 0,
          completion_rate: 0,
          should_disqualify: false
        });
      }

      const stats = reviewerStats.get(userId)!;
      stats.total_assigned++;
      if (assignment.status === 'DONE') {
        stats.completed++;
      }
    }

    // Calculate completion rates and determine who should be disqualified
    for (const [userId, stats] of reviewerStats) {
      stats.completion_rate = stats.completed / stats.total_assigned;
      stats.should_disqualify = stats.completed < stats.total_assigned;
    }

    // Get user details and submission IDs for those who should be disqualified
    const usersToDisqualify = Array.from(reviewerStats.values())
      .filter(s => s.should_disqualify);

    if (usersToDisqualify.length === 0) {
      console.log('   All reviewers completed their obligations');
      return [];
    }

    console.log(`   Found ${usersToDisqualify.length} reviewers with incomplete reviews`);

    // Get submission IDs for these users
    const { data: submissions, error: submissionsError } = await supabase
      .from('submissions')
      .select('id, user_id, submission_code, status')
      .eq('contest_id', contestId)
      .in('user_id', usersToDisqualify.map(u => u.user_id))
      .in('status', ['SUBMITTED', 'REINSTATED']); // Only disqualify eligible submissions

    if (submissionsError) {
      console.error('Error fetching submissions:', submissionsError);
      throw submissionsError;
    }

    if (!submissions || submissions.length === 0) {
      console.log('   No eligible submissions to disqualify');
      return [];
    }

    // Disqualify submissions
    const submissionIds = submissions.map(s => s.id);
    const { error: updateError } = await supabase
      .from('submissions')
      .update({ 
        status: 'DISQUALIFIED',
        updated_at: new Date().toISOString()
      })
      .in('id', submissionIds);

    if (updateError) {
      console.error('Error disqualifying submissions:', updateError);
      throw updateError;
    }

    // Log disqualifications
    for (const submission of submissions) {
      const stats = usersToDisqualify.find(u => u.user_id === submission.user_id);
      console.log(`   Disqualified: ${submission.submission_code} (completed ${stats?.completed}/${stats?.total_assigned} reviews)`);
      disqualifiedUserIds.push(submission.user_id);
    }

    return disqualifiedUserIds;
  } catch (error) {
    console.error('Error in enforceReviewObligations:', error);
    throw error;
  }
}

/**
 * Finalize all peer scores
 * 
 * Ensures all submissions have their peer scores calculated.
 * This is called before selecting finalists to ensure scores are up-to-date.
 * 
 * @param contestId - UUID of the contest
 * @returns Number of scores finalized
 */
export async function finalizeAllScores(contestId: string): Promise<number> {
  const supabase = await createClient();
  let scoresFinalized = 0;

  try {
    // Get all submissions for this contest that have completed reviews
    const { data: submissions, error: submissionsError } = await supabase
      .from('submissions')
      .select(`
        id,
        submission_code,
        score_peer,
        status
      `)
      .eq('contest_id', contestId)
      .in('status', ['SUBMITTED', 'REINSTATED']);

    if (submissionsError) {
      console.error('Error fetching submissions:', submissionsError);
      throw submissionsError;
    }

    if (!submissions || submissions.length === 0) {
      console.log('   No eligible submissions found');
      return 0;
    }

    console.log(`   Found ${submissions.length} eligible submissions`);

    // For each submission, check if it has reviews and calculate score if needed
    for (const submission of submissions) {
      try {
        // Check if submission has any completed reviews
        const { data: assignments, error: assignmentsError } = await supabase
          .from('peer_review_assignments')
          .select('id, status')
          .eq('submission_id', submission.id)
          .eq('status', 'DONE');

        if (assignmentsError) {
          console.error(`Error checking assignments for ${submission.submission_code}:`, assignmentsError);
          continue;
        }

        if (!assignments || assignments.length === 0) {
          console.log(`   ${submission.submission_code}: No completed reviews, skipping`);
          continue;
        }

        // Calculate or recalculate the score
        const score = await calculatePeerScore(submission.id);
        console.log(`   ${submission.submission_code}: Score = ${score.toFixed(2)} (${assignments.length} reviews)`);
        scoresFinalized++;
      } catch (error) {
        console.error(`Error calculating score for ${submission.submission_code}:`, error);
        // Continue with other submissions
      }
    }

    return scoresFinalized;
  } catch (error) {
    console.error('Error in finalizeAllScores:', error);
    throw error;
  }
}

/**
 * Select finalists
 * 
 * Ranks all submissions by peer score and selects the top N.
 * The finalist count is configurable (default 100).
 * 
 * @param contestId - UUID of the contest
 * @returns Array of finalist submissions
 */
export async function selectFinalists(
  contestId: string
): Promise<FinalistSubmission[]> {
  const supabase = await createClient();

  try {
    // Get finalist count configuration (default to 100)
    // TODO: This should come from contest settings when admin UI is implemented
    const finalistCount = 100;

    // Get all eligible submissions ranked by peer score
    const { data: submissions, error: submissionsError } = await supabase
      .from('submissions')
      .select('id, submission_code, user_id, score_peer, status')
      .eq('contest_id', contestId)
      .in('status', ['SUBMITTED', 'REINSTATED'])
      .not('score_peer', 'is', null)
      .order('score_peer', { ascending: false })
      .limit(finalistCount);

    if (submissionsError) {
      console.error('Error fetching submissions:', submissionsError);
      throw submissionsError;
    }

    if (!submissions || submissions.length === 0) {
      console.log('   No submissions with peer scores found');
      return [];
    }

    // Map to finalist format with ranks
    const finalists: FinalistSubmission[] = submissions.map((sub, index) => ({
      id: sub.id,
      submission_code: sub.submission_code,
      user_id: sub.user_id,
      score_peer: sub.score_peer || 0,
      rank: index + 1
    }));

    console.log(`   Selected top ${finalists.length} submissions`);
    console.log(`   Score range: ${finalists[0]?.score_peer.toFixed(2)} - ${finalists[finalists.length - 1]?.score_peer.toFixed(2)}`);

    return finalists;
  } catch (error) {
    console.error('Error in selectFinalists:', error);
    throw error;
  }
}

/**
 * Transition contest to PUBLIC_VOTING phase
 * 
 * Updates the contest phase to PUBLIC_VOTING.
 * 
 * @param contestId - UUID of the contest
 */
export async function transitionToPublicVoting(contestId: string): Promise<void> {
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from('contests')
      .update({
        phase: 'PUBLIC_VOTING',
        updated_at: new Date().toISOString()
      })
      .eq('id', contestId);

    if (error) {
      console.error('Error updating contest phase:', error);
      throw error;
    }

    console.log(`   Contest ${contestId} transitioned to PUBLIC_VOTING`);
  } catch (error) {
    console.error('Error in transitionToPublicVoting:', error);
    throw error;
  }
}

/**
 * Send notification emails
 * 
 * Sends emails to disqualified users and finalists.
 * This runs asynchronously and doesn't block the phase end process.
 * 
 * @param contestId - UUID of the contest
 * @param disqualifiedUserIds - Array of disqualified user IDs
 * @param finalists - Array of finalist submissions
 */
async function sendNotificationEmails(
  contestId: string,
  disqualifiedUserIds: string[],
  finalists: FinalistSubmission[]
): Promise<void> {
  try {
    // TODO: Implement email sending when email templates are created (Task 17)
    // For now, just log what would be sent
    
    console.log(`   Would send disqualification emails to ${disqualifiedUserIds.length} users`);
    console.log(`   Would send finalist emails to ${finalists.length} users`);
    
    // Email sending will be implemented in Task 17:
    // - sendDisqualificationEmail() for disqualified users
    // - sendFinalistNotificationEmail() for finalists
  } catch (error) {
    console.error('Error sending notification emails:', error);
    // Don't throw - email failures shouldn't fail the phase end process
  }
}
