/**
 * Peer Review Phase 5 - Review Service
 * 
 * This service handles the submission and validation of peer reviews.
 * 
 * Key responsibilities:
 * - Validate review submissions
 * - Store reviews in the database
 * - Update assignment status
 * - Check if all reviews are complete for a submission
 * - Trigger score calculation when all reviews are complete
 */

import { createClient } from '@/lib/supabase/server';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface ReviewScores {
  clarity: number;
  argument: number;
  style: number;
  moral_depth: number;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface CompletionStatus {
  complete: boolean;
  reviewCount: number;
  totalExpected: number;
}

// ============================================================================
// Main Functions
// ============================================================================

/**
 * Submit a peer review
 */
export async function submitReview(
  assignmentId: string,
  reviewerId: string,
  scores: ReviewScores,
  comment: string
): Promise<void> {
  const supabase = await createClient();

  // Start a transaction-like operation
  try {
    // 1. Create the review record
    const { error: reviewError } = await supabase
      .from('peer_review_reviews')
      .insert({
        assignment_id: assignmentId,
        clarity: scores.clarity,
        argument: scores.argument,
        style: scores.style,
        moral_depth: scores.moral_depth,
        comment_100: comment
      });

    if (reviewError) {
      console.error('Error creating review:', reviewError);
      throw new Error('Failed to create review');
    }

    // 2. Update the assignment status to DONE
    const { error: updateError } = await supabase
      .from('peer_review_assignments')
      .update({
        status: 'DONE',
        completed_at: new Date().toISOString()
      })
      .eq('id', assignmentId);

    if (updateError) {
      console.error('Error updating assignment:', updateError);
      throw new Error('Failed to update assignment status');
    }

    console.log(`✓ Review submitted for assignment ${assignmentId}`);
  } catch (error) {
    console.error('Error in submitReview:', error);
    throw error;
  }
}

/**
 * Validate review submission
 */
export async function validateReview(
  assignmentId: string,
  reviewerId: string
): Promise<ValidationResult> {
  const supabase = await createClient();

  try {
    // 1. Get the assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from('peer_review_assignments')
      .select('reviewer_user_id, status, deadline')
      .eq('id', assignmentId)
      .single();

    if (assignmentError || !assignment) {
      return {
        valid: false,
        error: 'Assignment not found'
      };
    }

    // 2. Verify user owns the assignment
    if (assignment.reviewer_user_id !== reviewerId) {
      return {
        valid: false,
        error: 'You do not own this assignment'
      };
    }

    // 3. Verify assignment status is PENDING
    if (assignment.status !== 'PENDING') {
      return {
        valid: false,
        error: `Assignment is ${assignment.status}, not PENDING`
      };
    }

    // 4. Verify assignment has not expired
    const deadline = new Date(assignment.deadline);
    const now = new Date();
    if (now > deadline) {
      return {
        valid: false,
        error: 'Assignment has expired'
      };
    }

    // 5. Verify no existing review for this assignment
    const { data: existingReview } = await supabase
      .from('peer_review_reviews')
      .select('id')
      .eq('assignment_id', assignmentId)
      .single();

    if (existingReview) {
      return {
        valid: false,
        error: 'Review already exists for this assignment'
      };
    }

    return { valid: true };
  } catch (error) {
    console.error('Error in validateReview:', error);
    return {
      valid: false,
      error: 'Validation error'
    };
  }
}

/**
 * Check if all reviews complete for a submission
 */
export async function checkSubmissionReviewCompletion(
  submissionId: string
): Promise<CompletionStatus> {
  const supabase = await createClient();

  try {
    // Get all assignments for this submission
    const { data: assignments, error } = await supabase
      .from('peer_review_assignments')
      .select('id, status')
      .eq('submission_id', submissionId);

    if (error) {
      console.error('Error fetching assignments:', error);
      throw error;
    }

    if (!assignments || assignments.length === 0) {
      return {
        complete: false,
        reviewCount: 0,
        totalExpected: 0
      };
    }

    const totalExpected = assignments.length;
    const completedCount = assignments.filter(a => a.status === 'DONE').length;

    return {
      complete: completedCount === totalExpected,
      reviewCount: completedCount,
      totalExpected
    };
  } catch (error) {
    console.error('Error in checkSubmissionReviewCompletion:', error);
    throw error;
  }
}

/**
 * Trigger score calculation if all reviews complete
 * This runs asynchronously and doesn't block the review submission
 * 
 * NOTE: This function imports scoring-service dynamically, which will be
 * implemented in task 9. Until then, this will gracefully fail with a log message.
 */
export async function triggerScoreCalculation(submissionId: string): Promise<void> {
  try {
    console.log(`Triggering score calculation for submission ${submissionId}`);
    
    // Import scoring service dynamically (implemented in task 9)
    const { calculatePeerScore } = await import('./scoring-service');
    
    // Calculate and store the score
    const score = await calculatePeerScore(submissionId);
    
    console.log(`✓ Score calculated for submission ${submissionId}: ${score.toFixed(2)}`);
  } catch (error) {
    console.error('Error in triggerScoreCalculation:', error);
    // Don't throw - this is async and shouldn't fail the review submission
  }
}
