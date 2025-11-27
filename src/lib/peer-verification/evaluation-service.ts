import { createClient } from '@/lib/supabase/server';

/**
 * Validation result for evaluation submission
 */
interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Completion status for a verification request
 */
interface CompletionStatus {
  complete: boolean;
  completedCount: number;
  totalCount: number;
}

/**
 * Validate that a user can submit an evaluation for an assignment
 */
export async function validateEvaluation(
  assignmentId: string,
  reviewerId: string
): Promise<ValidationResult> {
  const supabase = await createClient();

  // Fetch the assignment
  const { data: assignment, error } = await supabase
    .from('peer_assignments')
    .select('id, reviewer_user_id, status, deadline, submission_id')
    .eq('id', assignmentId)
    .single();

  if (error || !assignment) {
    return { valid: false, error: 'Assignment not found' };
  }

  // Verify user owns this assignment
  if (assignment.reviewer_user_id !== reviewerId) {
    return { valid: false, error: 'You do not have permission to review this assignment' };
  }

  // Verify assignment status is PENDING
  if (assignment.status !== 'PENDING') {
    return { valid: false, error: 'This assignment has already been completed or expired' };
  }

  // Verify assignment has not expired
  const now = new Date();
  const deadline = new Date(assignment.deadline);
  if (deadline < now) {
    return { valid: false, error: 'This assignment has expired' };
  }

  // Check if review already exists
  const { data: existingReview } = await supabase
    .from('peer_reviews')
    .select('id')
    .eq('assignment_id', assignmentId)
    .single();

  if (existingReview) {
    return { valid: false, error: 'You have already submitted a review for this assignment' };
  }

  // Verify user is not the submission author
  const { data: submission } = await supabase
    .from('submissions')
    .select('user_id')
    .eq('id', assignment.submission_id)
    .single();

  if (submission && submission.user_id === reviewerId) {
    return { valid: false, error: 'You cannot review your own submission' };
  }

  return { valid: true };
}

/**
 * Submit a peer evaluation
 */
export async function submitEvaluation(
  assignmentId: string,
  decision: 'ELIMINATE' | 'REINSTATE',
  comment: string
): Promise<void> {
  const supabase = await createClient();

  // Create peer_reviews record
  const { error: reviewError } = await supabase
    .from('peer_reviews')
    .insert({
      assignment_id: assignmentId,
      decision,
      comment_100: comment,
    });

  if (reviewError) {
    throw new Error('Failed to create review: ' + reviewError.message);
  }

  // Update peer_assignments status to DONE and set completed_at
  const { error: assignmentError } = await supabase
    .from('peer_assignments')
    .update({
      status: 'DONE',
      completed_at: new Date().toISOString(),
    })
    .eq('id', assignmentId);

  if (assignmentError) {
    throw new Error('Failed to update assignment: ' + assignmentError.message);
  }

  console.log('Evaluation submitted successfully:', {
    assignmentId,
    decision,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Check if all reviews are complete for a verification request
 */
export async function checkVerificationCompletion(
  submissionId: string
): Promise<CompletionStatus> {
  const supabase = await createClient();

  // Get all assignments for this submission
  const { data: assignments, error } = await supabase
    .from('peer_assignments')
    .select('id, status')
    .eq('submission_id', submissionId);

  if (error || !assignments) {
    console.error('Error fetching assignments:', error);
    return { complete: false, completedCount: 0, totalCount: 0 };
  }

  const totalCount = assignments.length;
  const completedCount = assignments.filter(a => a.status === 'DONE').length;
  const complete = completedCount === totalCount && totalCount > 0;

  return { complete, completedCount, totalCount };
}

/**
 * Trigger results calculation
 */
export async function triggerResultsCalculation(submissionId: string): Promise<void> {
  console.log('Results calculation triggered for submission:', submissionId);
  
  // Import and call the results service
  const { calculateResults } = await import('./results-service');
  await calculateResults(submissionId);
}
