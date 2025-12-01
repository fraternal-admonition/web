/**
 * Peer Review Phase 5 - Assignment Service
 * 
 * This service handles the creation and management of peer review assignments
 * when an admin triggers the PEER_REVIEW phase for a contest.
 * 
 * Key responsibilities:
 * - Identify eligible submissions (SUBMITTED or REINSTATED)
 * - Identify eligible reviewers (users with eligible submissions)
 * - Create balanced assignments (10 per reviewer, balanced across submissions)
 * - Send notification emails to reviewers
 */

import { createClient, createAdminClient } from '@/lib/supabase/server';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface Assignment {
  id?: string;
  submission_id: string;
  reviewer_user_id: string;
  status: 'PENDING' | 'DONE' | 'EXPIRED';
  assigned_at?: string;
  completed_at?: string | null;
  deadline: string;
}

export interface Submission {
  id: string;
  user_id: string;
  submission_code: string;
  title: string;
  body_text: string;
  status: string;
}

export interface Reviewer {
  id: string;
  display_id: string;
  email?: string;
}

export interface AssignmentResult {
  success: boolean;
  totalAssignments: number;
  reviewerCount: number;
  submissionCount: number;
  averageReviewsPerSubmission: number;
  errors?: string[];
}

// ============================================================================
// Main Entry Point
// ============================================================================

/**
 * Execute peer review assignments for a contest
 * Called when admin changes phase to PEER_REVIEW
 */
export async function executePeerReviewAssignments(
  contestId: string,
  reviewsPerReviewer: number = 10,
  deadlineDays: number = 7
): Promise<AssignmentResult> {
  console.log('=== STARTING PEER REVIEW ASSIGNMENT PROCESS ===');
  console.log(`Contest ID: ${contestId}`);
  console.log(`Reviews per reviewer: ${reviewsPerReviewer}`);
  console.log(`Deadline: ${deadlineDays} days`);

  try {
    // Step 1: Get eligible submissions
    const submissions = await getEligibleSubmissions(contestId);
    console.log(`Found ${submissions.length} eligible submissions`);

    if (submissions.length === 0) {
      return {
        success: false,
        totalAssignments: 0,
        reviewerCount: 0,
        submissionCount: 0,
        averageReviewsPerSubmission: 0,
        errors: ['No eligible submissions found']
      };
    }

    // Step 2: Get eligible reviewers
    const reviewers = await getEligibleReviewers(contestId);
    console.log(`Found ${reviewers.length} eligible reviewers`);

    if (reviewers.length === 0) {
      return {
        success: false,
        totalAssignments: 0,
        reviewerCount: 0,
        submissionCount: submissions.length,
        averageReviewsPerSubmission: 0,
        errors: ['No eligible reviewers found']
      };
    }

    // Step 3: Calculate deadline
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + deadlineDays);

    // Step 4: Create balanced assignments
    const assignments = await createBalancedAssignments(
      reviewers,
      submissions,
      reviewsPerReviewer,
      deadline
    );

    console.log(`Created ${assignments.length} assignments`);

    // Step 5: Insert assignments into database
    // Use admin client to bypass RLS
    const supabase = await createAdminClient();
    const { error: insertError } = await supabase
      .from('peer_review_assignments')
      .insert(assignments);

    if (insertError) {
      console.error('Error inserting assignments:', insertError);
      throw insertError;
    }

    // Step 6: Send notification emails (async, don't block)
    notifyReviewers(assignments, reviewers).catch(err => {
      console.error('Error sending notification emails:', err);
    });

    // Calculate statistics
    const avgReviews = assignments.length / submissions.length;

    console.log('=== PEER REVIEW ASSIGNMENT PROCESS COMPLETE ===');

    return {
      success: true,
      totalAssignments: assignments.length,
      reviewerCount: reviewers.length,
      submissionCount: submissions.length,
      averageReviewsPerSubmission: avgReviews
    };

  } catch (error) {
    console.error('Error in executePeerReviewAssignments:', error);
    return {
      success: false,
      totalAssignments: 0,
      reviewerCount: 0,
      submissionCount: 0,
      averageReviewsPerSubmission: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get eligible submissions (SUBMITTED or REINSTATED status)
 */
async function getEligibleSubmissions(contestId: string): Promise<Submission[]> {
  // Use admin client to bypass RLS and see all submissions
  const supabase = await createAdminClient();
  
  const { data, error } = await supabase
    .from('submissions')
    .select('id, user_id, submission_code, title, body_text, status')
    .eq('contest_id', contestId)
    .in('status', ['SUBMITTED', 'REINSTATED']);

  if (error) {
    console.error('Error fetching eligible submissions:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get eligible reviewers (users with SUBMITTED or REINSTATED submissions)
 */
async function getEligibleReviewers(contestId: string): Promise<Reviewer[]> {
  // Use admin client to bypass RLS and see all submissions
  const supabase = await createAdminClient();
  
  // Get users who have eligible submissions and are not banned
  const { data, error } = await supabase
    .from('submissions')
    .select(`
      user_id,
      users!inner (
        id,
        display_id,
        is_banned
      )
    `)
    .eq('contest_id', contestId)
    .in('status', ['SUBMITTED', 'REINSTATED']);

  if (error) {
    console.error('Error fetching eligible reviewers:', error);
    throw error;
  }

  if (!data) return [];

  // Extract unique users and filter out banned users
  const userMap = new Map<string, Reviewer>();
  
  for (const submission of data) {
    const user = submission.users as any;
    if (user && !user.is_banned && !userMap.has(user.id)) {
      userMap.set(user.id, {
        id: user.id,
        display_id: user.display_id
      });
    }
  }

  return Array.from(userMap.values());
}

/**
 * Create balanced assignments
 * Algorithm: Each reviewer gets N submissions, balanced across all submissions
 */
async function createBalancedAssignments(
  reviewers: Reviewer[],
  submissions: Submission[],
  reviewsPerReviewer: number,
  deadline: Date
): Promise<Assignment[]> {
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
    
    if (availableSubmissions.length === 0) {
      console.warn(`Reviewer ${reviewer.display_id} has no available submissions to review`);
      continue;
    }
    
    // Sort by current review count (ascending) for balance
    availableSubmissions.sort((a, b) => {
      const countA = reviewCountPerSubmission.get(a.id) || 0;
      const countB = reviewCountPerSubmission.get(b.id) || 0;
      return countA - countB;
    });
    
    // Assign first N (or all available if fewer)
    const toAssign = availableSubmissions.slice(0, Math.min(reviewsPerReviewer, availableSubmissions.length));
    
    for (const submission of toAssign) {
      assignments.push({
        submission_id: submission.id,
        reviewer_user_id: reviewer.id,
        status: 'PENDING',
        deadline: deadline.toISOString()
      });
      
      // Increment review count for this submission
      const current = reviewCountPerSubmission.get(submission.id) || 0;
      reviewCountPerSubmission.set(submission.id, current + 1);
    }
    
    if (toAssign.length < reviewsPerReviewer) {
      console.warn(
        `Reviewer ${reviewer.display_id} only assigned ${toAssign.length} of ${reviewsPerReviewer} reviews (insufficient submissions)`
      );
    }
  }
  
  // Log distribution statistics
  const reviewCounts = Array.from(reviewCountPerSubmission.values());
  const minReviews = Math.min(...reviewCounts);
  const maxReviews = Math.max(...reviewCounts);
  const avgReviews = reviewCounts.reduce((sum, count) => sum + count, 0) / reviewCounts.length;
  
  console.log('Assignment distribution:');
  console.log(`  Min reviews per submission: ${minReviews}`);
  console.log(`  Max reviews per submission: ${maxReviews}`);
  console.log(`  Avg reviews per submission: ${avgReviews.toFixed(2)}`);
  console.log(`  Variance: ${maxReviews - minReviews}`);
  
  return assignments;
}

/**
 * Send notification emails to reviewers
 * This runs asynchronously and doesn't block the assignment process
 */
async function notifyReviewers(
  assignments: Assignment[],
  reviewers: Reviewer[]
): Promise<void> {
  console.log('Sending notification emails to reviewers...');
  
  // Import email function
  const { sendPeerReviewAssignmentEmail } = await import('@/lib/email');
  
  // Group assignments by reviewer
  const assignmentsByReviewer = new Map<string, number>();
  const deadlineByReviewer = new Map<string, string>();
  
  for (const assignment of assignments) {
    const count = assignmentsByReviewer.get(assignment.reviewer_user_id) || 0;
    assignmentsByReviewer.set(assignment.reviewer_user_id, count + 1);
    
    // Store deadline (all assignments for a reviewer have same deadline)
    if (!deadlineByReviewer.has(assignment.reviewer_user_id)) {
      deadlineByReviewer.set(assignment.reviewer_user_id, assignment.deadline);
    }
  }
  
  // Get user emails from Supabase auth (use admin client for auth.admin access)
  const supabase = await createAdminClient();
  
  // Send emails with rate limiting (600ms between emails)
  let emailsSent = 0;
  let emailsFailed = 0;
  
  for (const reviewer of reviewers) {
    const assignmentCount = assignmentsByReviewer.get(reviewer.id) || 0;
    if (assignmentCount === 0) continue;
    
    try {
      // Get user email from auth.users
      const { data: authUser } = await supabase.auth.admin.getUserById(reviewer.id);
      
      if (!authUser?.user?.email) {
        console.warn(`No email found for reviewer ${reviewer.display_id}`);
        emailsFailed++;
        continue;
      }
      
      const deadline = deadlineByReviewer.get(reviewer.id) || new Date().toISOString();
      
      // Send email
      const result = await sendPeerReviewAssignmentEmail(authUser.user.email, {
        reviewer_name: reviewer.display_id,
        assignment_count: assignmentCount,
        deadline
      });
      
      if (result.success) {
        console.log(`✓ Sent email to ${reviewer.display_id}: ${assignmentCount} assignments`);
        emailsSent++;
      } else {
        console.error(`✗ Failed to send email to ${reviewer.display_id}`);
        emailsFailed++;
      }
      
      // Rate limiting: wait 600ms between emails
      await new Promise(resolve => setTimeout(resolve, 600));
      
    } catch (error) {
      console.error(`Error sending email to ${reviewer.display_id}:`, error);
      emailsFailed++;
    }
  }
  
  console.log(`Notification emails complete: ${emailsSent} sent, ${emailsFailed} failed`);
}
