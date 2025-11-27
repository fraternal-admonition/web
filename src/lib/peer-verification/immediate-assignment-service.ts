/**
 * Immediate Assignment Service for Peer Verification
 * 
 * This service is triggered immediately after a peer verification payment is confirmed.
 * It assigns 10 reviewers to evaluate the verification request along with 2 control submissions each.
 * 
 * Key Features:
 * - Immediate processing (no waiting for contest phase transitions)
 * - Blind review (reviewers don't know which submission is the verification request)
 * - Control submissions to measure reviewer accuracy
 * - 7-day deadline for each assignment
 */

import { createAdminClient } from "@/lib/supabase/server";

// ============================================================================
// TypeScript Interfaces
// ============================================================================

export interface User {
  id: string;
  display_id: string | null;
  is_banned: boolean;
  integrity_score: number;
  qualified_evaluator: boolean;
}

export interface Submission {
  id: string;
  contest_id: string;
  user_id: string;
  title: string;
  body_text: string;
  status: string;
  submission_code: string;
}

export interface Assignment {
  id: string;
  submission_id: string;
  reviewer_user_id: string;
  status: 'PENDING' | 'DONE' | 'EXPIRED';
  assigned_at: string;
  deadline: string;
}

export interface VerificationRequest {
  submission: Submission;
  contestId: string;
  authorUserId: string;
}

export interface AssignmentResult {
  success: boolean;
  assignedReviewers: number;
  totalAssignments: number;
  warnings: string[];
  errors: string[];
}

// ============================================================================
// Main Entry Point
// ============================================================================

/**
 * Main entry point - called immediately after payment webhook confirms
 * 
 * This function orchestrates the entire immediate assignment process:
 * 1. Fetch verification request details
 * 2. Get eligible reviewers
 * 3. Select 10 reviewers randomly
 * 4. Get control submissions
 * 5. Create assignments for all reviewers
 * 6. Send notification emails
 * 
 * @param submissionId - The ID of the submission requesting peer verification
 * @returns Promise<AssignmentResult> - Result of the assignment process
 */
export async function executeImmediateAssignment(
  submissionId: string
): Promise<AssignmentResult> {
  const result: AssignmentResult = {
    success: false,
    assignedReviewers: 0,
    totalAssignments: 0,
    warnings: [],
    errors: [],
  };

  try {
    console.log(`[ImmediateAssignment] Starting assignment for submission: ${submissionId}`);
    const startTime = Date.now();

    // Get admin client for database operations
    const adminSupabase = await createAdminClient();

    // Step 1: Fetch verification request details
    const { data: submission, error: submissionError } = await adminSupabase
      .from('submissions')
      .select('id, contest_id, user_id, title, body_text, status, submission_code')
      .eq('id', submissionId)
      .single();

    if (submissionError || !submission) {
      result.errors.push(`Failed to fetch submission: ${submissionError?.message}`);
      console.error('[ImmediateAssignment] Submission fetch error:', submissionError);
      return result;
    }

    // Verify submission is in correct status
    if (submission.status !== 'PEER_VERIFICATION_PENDING') {
      result.errors.push(`Submission status is ${submission.status}, expected PEER_VERIFICATION_PENDING`);
      console.error('[ImmediateAssignment] Invalid submission status:', submission.status);
      return result;
    }

    const verificationRequest: VerificationRequest = {
      submission,
      contestId: submission.contest_id,
      authorUserId: submission.user_id,
    };

    console.log(`[ImmediateAssignment] Verification request for contest: ${verificationRequest.contestId}`);

    // Step 2: Get eligible reviewers
    const eligibleReviewers = await getEligibleReviewers(
      verificationRequest.contestId,
      verificationRequest.authorUserId
    );

    console.log(`[ImmediateAssignment] Found ${eligibleReviewers.length} eligible reviewers`);

    if (eligibleReviewers.length === 0) {
      result.errors.push('No eligible reviewers found for this contest');
      console.error('[ImmediateAssignment] No eligible reviewers');
      return result;
    }

    // Step 3: Select reviewers (up to 10)
    const targetReviewerCount = 10;
    const selectedReviewers = selectReviewers(eligibleReviewers, targetReviewerCount);

    if (selectedReviewers.length < targetReviewerCount) {
      result.warnings.push(
        `Only ${selectedReviewers.length} reviewers available (target: ${targetReviewerCount})`
      );
      console.warn(
        `[ImmediateAssignment] Insufficient reviewers: ${selectedReviewers.length}/${targetReviewerCount}`
      );
    }

    console.log(`[ImmediateAssignment] Selected ${selectedReviewers.length} reviewers`);

    // Step 4: Get control submissions
    const controlSubmissions = await getControlSubmissions(
      verificationRequest.contestId,
      selectedReviewers.length
    );

    console.log(
      `[ImmediateAssignment] Found ${controlSubmissions.passed.length} AI-passed and ` +
      `${controlSubmissions.eliminated.length} AI-eliminated control submissions`
    );

    if (controlSubmissions.passed.length === 0) {
      result.warnings.push('No AI-passed control submissions available');
    }
    if (controlSubmissions.eliminated.length === 0) {
      result.warnings.push('No AI-eliminated control submissions available');
    }

    // Step 5: Create assignments for all reviewers (with transaction handling)
    const assignmentResults = await assignSubmissionsToReviewers(
      verificationRequest.submission,
      selectedReviewers,
      controlSubmissions
    );

    result.assignedReviewers = assignmentResults.successfulReviewers;
    result.totalAssignments = assignmentResults.totalAssignments;
    result.warnings.push(...assignmentResults.warnings);
    result.errors.push(...assignmentResults.errors);

    // Step 6: Send notification emails
    await notifyReviewers(assignmentResults.assignments, selectedReviewers);

    result.success = assignmentResults.successfulReviewers > 0;

    const duration = Date.now() - startTime;
    console.log(
      `[ImmediateAssignment] Assignment completed in ${duration}ms: ` +
      `${result.assignedReviewers} reviewers, ${result.totalAssignments} assignments`
    );

    return result;
  } catch (error) {
    console.error('[ImmediateAssignment] Unexpected error:', error);
    result.errors.push(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return result;
  }
}

// ============================================================================
// Eligible Reviewer Query
// ============================================================================

/**
 * Get eligible reviewers for this contest
 * 
 * Eligibility criteria:
 * - User has at least one submission in status SUBMITTED or ELIMINATED in the same contest
 * - User is not banned (is_banned = false)
 * - User is not the verification request author
 * 
 * @param contestId - The contest ID
 * @param excludeUserId - The user ID to exclude (verification request author)
 * @returns Promise<User[]> - List of eligible reviewers
 */
async function getEligibleReviewers(
  contestId: string,
  excludeUserId: string
): Promise<User[]> {
  try {
    const adminSupabase = await createAdminClient();

    // First, get user IDs who have submissions in the contest
    const { data: submissionsData, error: submissionsError } = await adminSupabase
      .from('submissions')
      .select('user_id')
      .eq('contest_id', contestId)
      .in('status', ['SUBMITTED', 'ELIMINATED']);

    if (submissionsError) {
      console.error('[ImmediateAssignment] Error fetching submissions:', submissionsError);
      return [];
    }

    // Extract unique user IDs
    const userIds = [...new Set(submissionsData?.map((s) => s.user_id) || [])];

    if (userIds.length === 0) {
      console.log('[ImmediateAssignment] No users with submissions found');
      return [];
    }

    // Query users who meet the eligibility criteria
    const { data: eligibleUsers, error } = await adminSupabase
      .from('users')
      .select(`
        id,
        display_id,
        is_banned,
        integrity_score,
        qualified_evaluator
      `)
      .eq('is_banned', false)
      .neq('id', excludeUserId)
      .in('id', userIds);

    if (error) {
      console.error('[ImmediateAssignment] Error fetching eligible reviewers:', error);
      return [];
    }

    // Filter out users who have 2 or more expired assignments (from requirement 6.5)
    // This will be implemented when we have the expired assignment tracking
    const filteredUsers = eligibleUsers || [];

    console.log(`[ImmediateAssignment] Eligible reviewers query returned ${filteredUsers.length} users`);

    return filteredUsers as User[];
  } catch (error) {
    console.error('[ImmediateAssignment] Error in getEligibleReviewers:', error);
    return [];
  }
}

// ============================================================================
// Random Reviewer Selection
// ============================================================================

/**
 * Randomly select reviewers from eligible pool
 * 
 * Uses Fisher-Yates shuffle algorithm for unbiased random selection
 * 
 * @param eligibleReviewers - Array of eligible reviewers
 * @param count - Number of reviewers to select (default: 10)
 * @returns User[] - Selected reviewers
 */
function selectReviewers(eligibleReviewers: User[], count: number = 10): User[] {
  if (eligibleReviewers.length === 0) {
    return [];
  }

  // If we have fewer reviewers than requested, return all
  if (eligibleReviewers.length <= count) {
    console.log(`[ImmediateAssignment] Returning all ${eligibleReviewers.length} available reviewers`);
    return [...eligibleReviewers];
  }

  // Fisher-Yates shuffle algorithm
  const shuffled = [...eligibleReviewers];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Return first 'count' reviewers
  const selected = shuffled.slice(0, count);
  console.log(`[ImmediateAssignment] Selected ${selected.length} reviewers from pool of ${eligibleReviewers.length}`);

  return selected;
}

// ============================================================================
// Control Submission Selection (Task 2.4)
// ============================================================================

/**
 * Get control submissions for peer verification
 * 
 * Control submissions are used to measure reviewer accuracy:
 * - AI-passed submissions (status = SUBMITTED): Reviewers should vote "Reinstate"
 * - AI-eliminated accepted submissions (status = ELIMINATED_ACCEPTED): Reviewers should vote "Eliminate"
 * 
 * Note: Control submissions can be reused across multiple reviewers.
 * Each reviewer randomly selects from the available pool.
 * 
 * @param contestId - The contest ID
 * @param count - Not used anymore, kept for backward compatibility
 * @returns Promise with arrays of passed and eliminated control submissions
 */
async function getControlSubmissions(
  contestId: string,
  count: number
): Promise<{ passed: Submission[]; eliminated: Submission[] }> {
  try {
    const adminSupabase = await createAdminClient();

    // Get all available AI-passed submissions (status = SUBMITTED)
    // Fetch more than needed since they can be reused across reviewers
    const { data: passedSubmissions, error: passedError } = await adminSupabase
      .from('submissions')
      .select('id, contest_id, user_id, title, body_text, status, submission_code')
      .eq('contest_id', contestId)
      .eq('status', 'SUBMITTED')
      .limit(50); // Get up to 50 for variety

    if (passedError) {
      console.error('[ImmediateAssignment] Error fetching AI-passed submissions:', passedError);
    }

    // Get all available AI-eliminated accepted submissions (status = ELIMINATED_ACCEPTED)
    // These are submissions where the author explicitly chose Option A (accept AI decision)
    const { data: eliminatedSubmissions, error: eliminatedError } = await adminSupabase
      .from('submissions')
      .select('id, contest_id, user_id, title, body_text, status, submission_code')
      .eq('contest_id', contestId)
      .eq('status', 'ELIMINATED_ACCEPTED')
      .limit(50); // Get up to 50 for variety

    if (eliminatedError) {
      console.error('[ImmediateAssignment] Error fetching AI-eliminated submissions:', eliminatedError);
    }

    // Return all available control submissions (no slicing needed)
    const passed = passedSubmissions || [];
    const eliminated = eliminatedSubmissions || [];

    console.log(
      `[ImmediateAssignment] Control submissions available: ${passed.length} passed, ${eliminated.length} eliminated`
    );

    return {
      passed: passed as Submission[],
      eliminated: eliminated as Submission[],
    };
  } catch (error) {
    console.error('[ImmediateAssignment] Error in getControlSubmissions:', error);
    return { passed: [], eliminated: [] };
  }
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ============================================================================
// Assignment Creation (Task 2.5 & 2.6)
// ============================================================================

interface AssignmentCreationResult {
  successfulReviewers: number;
  totalAssignments: number;
  assignments: Assignment[];
  warnings: string[];
  errors: string[];
}

/**
 * Assign the verification request + 2 control submissions to each reviewer
 * 
 * Each reviewer gets 3 assignments:
 * - 1 verification request (the submission being appealed)
 * - 1 AI-passed control submission
 * - 1 AI-eliminated control submission
 * 
 * The order is randomized so reviewers can't identify which is which.
 * 
 * @param verificationSubmission - The submission requesting peer verification
 * @param reviewers - Selected reviewers
 * @param controlSubmissions - Control submissions (passed and eliminated)
 * @returns Promise<AssignmentCreationResult>
 */
async function assignSubmissionsToReviewers(
  verificationSubmission: Submission,
  reviewers: User[],
  controlSubmissions: { passed: Submission[]; eliminated: Submission[] }
): Promise<AssignmentCreationResult> {
  const result: AssignmentCreationResult = {
    successfulReviewers: 0,
    totalAssignments: 0,
    assignments: [],
    warnings: [],
    errors: [],
  };

  const adminSupabase = await createAdminClient();
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 7); // 7 days from now

  // Process each reviewer with retry logic
  for (let i = 0; i < reviewers.length; i++) {
    const reviewer = reviewers[i];
    const retryAttempts = 3;
    let success = false;

    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        // Build the 3 submissions for this reviewer
        const submissions: Submission[] = [verificationSubmission];

        // Add random control submissions (can be reused across reviewers)
        // Each reviewer gets 1 random SUBMITTED and 1 random ELIMINATED_ACCEPTED
        if (controlSubmissions.passed.length > 0) {
          const randomPassedIndex = Math.floor(Math.random() * controlSubmissions.passed.length);
          submissions.push(controlSubmissions.passed[randomPassedIndex]);
        }
        if (controlSubmissions.eliminated.length > 0) {
          const randomEliminatedIndex = Math.floor(Math.random() * controlSubmissions.eliminated.length);
          submissions.push(controlSubmissions.eliminated[randomEliminatedIndex]);
        }

        // Randomize order so reviewer can't identify which is which
        const randomizedSubmissions = shuffleArray(submissions);

        // Create assignments in a transaction-like batch
        const assignmentsToCreate = randomizedSubmissions.map((submission) => ({
          submission_id: submission.id,
          reviewer_user_id: reviewer.id,
          status: 'PENDING' as const,
          assigned_at: new Date().toISOString(),
          deadline: deadline.toISOString(),
        }));

        const { data: createdAssignments, error: assignmentError } = await adminSupabase
          .from('peer_assignments')
          .insert(assignmentsToCreate)
          .select();

        if (assignmentError) {
          throw assignmentError;
        }

        // Success!
        result.successfulReviewers++;
        result.totalAssignments += createdAssignments?.length || 0;
        
        if (createdAssignments) {
          result.assignments.push(...(createdAssignments as Assignment[]));
        }

        console.log(
          `[ImmediateAssignment] Created ${assignmentsToCreate.length} assignments for reviewer ${reviewer.id}`
        );

        success = true;
        break; // Exit retry loop
      } catch (error) {
        console.error(
          `[ImmediateAssignment] Attempt ${attempt}/${retryAttempts} failed for reviewer ${reviewer.id}:`,
          error
        );

        if (attempt === retryAttempts) {
          // Final attempt failed
          result.errors.push(
            `Failed to create assignments for reviewer ${reviewer.id} after ${retryAttempts} attempts`
          );
        } else {
          // Wait before retry (exponential backoff)
          await new Promise((resolve) => setTimeout(resolve, 100 * attempt));
        }
      }
    }

    if (!success) {
      console.error(`[ImmediateAssignment] All retry attempts failed for reviewer ${reviewer.id}`);
    }
  }

  console.log(
    `[ImmediateAssignment] Assignment creation complete: ` +
    `${result.successfulReviewers}/${reviewers.length} reviewers, ` +
    `${result.totalAssignments} total assignments`
  );

  return result;
}

// ============================================================================
// Email Notifications (Task 3)
// ============================================================================

/**
 * Send assignment notification emails to all reviewers
 * 
 * Groups assignments by reviewer and sends one email per reviewer
 * with their assignment count and deadline.
 * 
 * @param assignments - All created assignments
 * @param reviewers - List of reviewers who received assignments
 */
async function notifyReviewers(assignments: Assignment[], reviewers: User[]): Promise<void> {
  try {
    const { sendAssignmentNotificationEmail } = await import('@/lib/email');
    const adminSupabase = await createAdminClient();

    // Group assignments by reviewer
    const assignmentsByReviewer = new Map<string, Assignment[]>();
    for (const assignment of assignments) {
      const reviewerId = assignment.reviewer_user_id;
      if (!assignmentsByReviewer.has(reviewerId)) {
        assignmentsByReviewer.set(reviewerId, []);
      }
      assignmentsByReviewer.get(reviewerId)!.push(assignment);
    }

    console.log(`[ImmediateAssignment] Sending emails to ${assignmentsByReviewer.size} reviewers`);

    // Send emails sequentially with delay to respect Resend rate limit (2 requests/second)
    let emailsSent = 0;
    let emailsFailed = 0;

    for (const [reviewerId, reviewerAssignments] of assignmentsByReviewer.entries()) {
      try {
        // Get reviewer email
        const { data: userData } = await adminSupabase.auth.admin.getUserById(reviewerId);

        if (!userData?.user?.email) {
          console.error(`[ImmediateAssignment] No email found for reviewer ${reviewerId}`);
          emailsFailed++;
          continue;
        }

        // Get reviewer display name
        const reviewer = reviewers.find((r) => r.id === reviewerId);
        const reviewerName = reviewer?.display_id || undefined;

        // Get deadline from first assignment (all have same deadline)
        const deadline = reviewerAssignments[0].deadline;

        // Send email
        const result = await sendAssignmentNotificationEmail(userData.user.email, {
          reviewer_name: reviewerName,
          assignment_count: reviewerAssignments.length,
          deadline: deadline,
        });

        if (result.success) {
          console.log(
            `[ImmediateAssignment] Email sent to ${userData.user.email} ` +
            `(${reviewerAssignments.length} assignments)`
          );
          emailsSent++;
        } else {
          console.error(
            `[ImmediateAssignment] Failed to send email to ${userData.user.email}:`,
            result.error
          );
          emailsFailed++;
        }

        // Rate limit: Wait 600ms between emails (allows ~1.6 emails/second, safely under 2/second limit)
        // Only wait if there are more emails to send
        if (emailsSent + emailsFailed < assignmentsByReviewer.size) {
          await new Promise((resolve) => setTimeout(resolve, 600));
        }
      } catch (error) {
        console.error(`[ImmediateAssignment] Error sending email to reviewer ${reviewerId}:`, error);
        emailsFailed++;
        // Don't throw - we don't want email failures to fail the assignment process
      }
    }

    console.log(
      `[ImmediateAssignment] Email notifications completed: ` +
      `${emailsSent} sent, ${emailsFailed} failed`
    );
  } catch (error) {
    console.error('[ImmediateAssignment] Error in notifyReviewers:', error);
    // Don't throw - email failures shouldn't fail the assignment process
  }
}
