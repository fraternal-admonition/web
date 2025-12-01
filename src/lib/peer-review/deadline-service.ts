/**
 * Deadline Management Service for Peer Review (Phase 5)
 * 
 * Handles:
 * - Expired assignment detection and marking
 * - Assignment reassignment to new reviewers
 * - Deadline warning emails (24h before)
 * 
 * Key differences from peer verification:
 * - Uses peer_review_assignments table (not peer_assignments)
 * - No refund processing (peer review is free)
 * - Simpler reassignment logic (no blacklisting for expired assignments)
 */

import { createClient, createAdminClient } from '@/lib/supabase/server';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface DeadlineCheckResult {
  expiredCount: number;
  errors: string[];
}

export interface ReassignmentResult {
  reassignedCount: number;
  errors: string[];
}

export interface WarningResult {
  sentCount: number;
  errors: string[];
}

// ============================================================================
// Expired Assignment Detection
// ============================================================================

/**
 * Check for expired assignments and mark them as EXPIRED
 * Requirements: 11.1
 */
export async function checkExpiredAssignments(): Promise<DeadlineCheckResult> {
  console.log('[checkExpiredAssignments] Starting expired assignment check');
  
  const supabase = await createAdminClient();
  const errors: string[] = [];
  
  try {
    const now = new Date().toISOString();
    
    // Query assignments with deadline < NOW() and status PENDING
    const { data: expiredAssignments, error: queryError } = await supabase
      .from('peer_review_assignments')
      .select('id, submission_id, reviewer_user_id, deadline')
      .eq('status', 'PENDING')
      .lt('deadline', now);
    
    if (queryError) {
      console.error('[checkExpiredAssignments] Error querying expired assignments:', queryError);
      errors.push(`Query error: ${queryError.message}`);
      return { expiredCount: 0, errors };
    }
    
    if (!expiredAssignments || expiredAssignments.length === 0) {
      console.log('[checkExpiredAssignments] No expired assignments found');
      return { expiredCount: 0, errors };
    }
    
    console.log(`[checkExpiredAssignments] Found ${expiredAssignments.length} expired assignments`);
    
    // Update status to EXPIRED for all expired assignments
    const { error: updateError } = await supabase
      .from('peer_review_assignments')
      .update({ status: 'EXPIRED' })
      .in('id', expiredAssignments.map(a => a.id));
    
    if (updateError) {
      console.error('[checkExpiredAssignments] Error updating expired assignments:', updateError);
      errors.push(`Update error: ${updateError.message}`);
      return { expiredCount: 0, errors };
    }
    
    console.log(`[checkExpiredAssignments] Successfully marked ${expiredAssignments.length} assignments as EXPIRED`);
    
    return {
      expiredCount: expiredAssignments.length,
      errors
    };
  } catch (error) {
    console.error('[checkExpiredAssignments] Unexpected error:', error);
    errors.push(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
    return { expiredCount: 0, errors };
  }
}

// ============================================================================
// Assignment Reassignment
// ============================================================================

/**
 * Reassign expired assignments to new reviewers
 * Requirements: 11.2, 11.3, 11.4, 11.5
 */
export async function reassignExpiredAssignments(): Promise<ReassignmentResult> {
  console.log('[reassignExpiredAssignments] Starting reassignment process');
  
  const supabase = await createAdminClient();
  const errors: string[] = [];
  let reassignedCount = 0;
  
  try {
    // Get all EXPIRED assignments that need reassignment
    const { data: expiredAssignments, error: queryError } = await supabase
      .from('peer_review_assignments')
      .select(`
        id,
        submission_id,
        reviewer_user_id,
        deadline,
        submissions!inner(
          id,
          contest_id,
          user_id
        )
      `)
      .eq('status', 'EXPIRED');
    
    if (queryError) {
      console.error('[reassignExpiredAssignments] Error querying expired assignments:', queryError);
      errors.push(`Query error: ${queryError.message}`);
      return { reassignedCount: 0, errors };
    }
    
    if (!expiredAssignments || expiredAssignments.length === 0) {
      console.log('[reassignExpiredAssignments] No expired assignments to reassign');
      return { reassignedCount: 0, errors };
    }
    
    console.log(`[reassignExpiredAssignments] Processing ${expiredAssignments.length} expired assignments`);
    
    // Process each expired assignment
    for (const assignment of expiredAssignments) {
      try {
        const submission = assignment.submissions as any;
        const contestId = submission.contest_id;
        const authorUserId = submission.user_id;
        const submissionId = assignment.submission_id;
        
        // Get all reviewers who have already reviewed this submission
        const { data: existingReviewers } = await supabase
          .from('peer_review_assignments')
          .select('reviewer_user_id')
          .eq('submission_id', submissionId);
        
        const existingReviewerIds = existingReviewers?.map(r => r.reviewer_user_id) || [];
        
        // Get eligible reviewers for this contest
        // Eligible = users with SUBMITTED or REINSTATED submissions, not banned
        const { data: eligibleSubmissions } = await supabase
          .from('submissions')
          .select(`
            user_id,
            users!inner(
              id,
              display_id,
              is_banned
            )
          `)
          .eq('contest_id', contestId)
          .in('status', ['SUBMITTED', 'REINSTATED']);
        
        if (!eligibleSubmissions || eligibleSubmissions.length === 0) {
          console.warn(`[reassignExpiredAssignments] No eligible reviewers for assignment ${assignment.id}`);
          errors.push(`No eligible reviewers for assignment ${assignment.id}`);
          continue;
        }
        
        // Extract unique users, exclude author, existing reviewers, and banned users
        const eligibleReviewers = eligibleSubmissions
          .map(s => s.users as any)
          .filter((user, index, self) => 
            user &&
            !user.is_banned &&
            user.id !== authorUserId &&
            !existingReviewerIds.includes(user.id) &&
            self.findIndex(u => u?.id === user.id) === index
          );
        
        if (eligibleReviewers.length === 0) {
          console.warn(`[reassignExpiredAssignments] No available reviewers for assignment ${assignment.id}`);
          errors.push(`No available reviewers for assignment ${assignment.id}`);
          continue;
        }
        
        // Randomly select one reviewer
        const newReviewer = eligibleReviewers[Math.floor(Math.random() * eligibleReviewers.length)];
        
        // Create new assignment with fresh 7-day deadline
        const newDeadline = new Date();
        newDeadline.setDate(newDeadline.getDate() + 7);
        
        const { error: insertError } = await supabase
          .from('peer_review_assignments')
          .insert({
            submission_id: submissionId,
            reviewer_user_id: newReviewer.id,
            status: 'PENDING',
            deadline: newDeadline.toISOString(),
            assigned_at: new Date().toISOString()
          });
        
        if (insertError) {
          console.error(`[reassignExpiredAssignments] Error creating new assignment:`, insertError);
          errors.push(`Insert error for assignment ${assignment.id}: ${insertError.message}`);
          continue;
        }
        
        // Get reviewer email for notification
        const { data: authUser } = await supabase.auth.admin.getUserById(newReviewer.id);
        const email = authUser?.user?.email;
        
        if (email) {
          // Send reassignment notification email
          const { sendPeerReviewAssignmentEmail } = await import('@/lib/email');
          await sendPeerReviewAssignmentEmail(email, {
            reviewer_name: newReviewer.display_id,
            assignment_count: 1,
            deadline: newDeadline.toISOString()
          }).catch(emailError => {
            console.error(`[reassignExpiredAssignments] Error sending email to ${newReviewer.display_id}:`, emailError);
            errors.push(`Email error for reviewer ${newReviewer.id}`);
          });
        }
        
        reassignedCount++;
        console.log(`[reassignExpiredAssignments] Successfully reassigned assignment ${assignment.id} to reviewer ${newReviewer.id}`);
        
      } catch (assignmentError) {
        console.error(`[reassignExpiredAssignments] Error processing assignment ${assignment.id}:`, assignmentError);
        errors.push(`Processing error for assignment ${assignment.id}: ${assignmentError instanceof Error ? assignmentError.message : String(assignmentError)}`);
      }
    }
    
    console.log(`[reassignExpiredAssignments] Successfully reassigned ${reassignedCount} assignments`);
    
    return {
      reassignedCount,
      errors
    };
  } catch (error) {
    console.error('[reassignExpiredAssignments] Unexpected error:', error);
    errors.push(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
    return { reassignedCount: 0, errors };
  }
}

// ============================================================================
// Deadline Warning Emails
// ============================================================================

/**
 * Send deadline warning emails (24 hours before deadline)
 * Requirements: 11.4, 22.2
 */
export async function sendDeadlineWarnings(): Promise<WarningResult> {
  console.log('[sendDeadlineWarnings] Starting deadline warning process');
  
  const supabase = await createAdminClient();
  const errors: string[] = [];
  let sentCount = 0;
  
  try {
    // Calculate 24 hours from now (with 1-hour window for cron timing)
    const twentyFourHoursFromNow = new Date();
    twentyFourHoursFromNow.setHours(twentyFourHoursFromNow.getHours() + 24);
    
    const twentyThreeHoursFromNow = new Date();
    twentyThreeHoursFromNow.setHours(twentyThreeHoursFromNow.getHours() + 23);
    
    // Query assignments with deadline within 23-24 hours and status PENDING
    const { data: upcomingAssignments, error: queryError } = await supabase
      .from('peer_review_assignments')
      .select('id, submission_id, reviewer_user_id, deadline')
      .eq('status', 'PENDING')
      .gte('deadline', twentyThreeHoursFromNow.toISOString())
      .lte('deadline', twentyFourHoursFromNow.toISOString());
    
    if (queryError) {
      console.error('[sendDeadlineWarnings] Error querying upcoming assignments:', queryError);
      errors.push(`Query error: ${queryError.message}`);
      return { sentCount: 0, errors };
    }
    
    if (!upcomingAssignments || upcomingAssignments.length === 0) {
      console.log('[sendDeadlineWarnings] No assignments with upcoming deadlines');
      return { sentCount: 0, errors };
    }
    
    console.log(`[sendDeadlineWarnings] Found ${upcomingAssignments.length} assignments with upcoming deadlines`);
    
    // Group assignments by reviewer
    const assignmentsByReviewer = upcomingAssignments.reduce((acc: Record<string, typeof upcomingAssignments>, curr) => {
      if (!acc[curr.reviewer_user_id]) {
        acc[curr.reviewer_user_id] = [];
      }
      acc[curr.reviewer_user_id].push(curr);
      return acc;
    }, {});
    
    // Send warning email to each reviewer
    for (const [reviewerId, assignments] of Object.entries(assignmentsByReviewer)) {
      try {
        // Get reviewer email and display_id
        const { data: authUser } = await supabase.auth.admin.getUserById(reviewerId);
        const email = authUser?.user?.email;
        
        if (!email) {
          console.warn(`[sendDeadlineWarnings] No email found for reviewer ${reviewerId}`);
          errors.push(`No email for reviewer ${reviewerId}`);
          continue;
        }
        
        // Get reviewer display_id
        const { data: user } = await supabase
          .from('users')
          .select('display_id')
          .eq('id', reviewerId)
          .single();
        
        const deadline = assignments[0].deadline;
        
        // Send warning email
        const { sendPeerReviewDeadlineWarningEmail } = await import('@/lib/peer-review/email-templates');
        const result = await sendPeerReviewDeadlineWarningEmail(email, {
          reviewer_name: user?.display_id,
          pending_count: assignments.length,
          deadline
        });
        
        if (result.success) {
          console.log(`[sendDeadlineWarnings] ✓ Sent warning email to reviewer ${reviewerId}: ${assignments.length} assignments`);
          sentCount++;
        } else {
          console.error(`[sendDeadlineWarnings] ✗ Failed to send email to reviewer ${reviewerId}`);
          errors.push(`Email failed for reviewer ${reviewerId}`);
        }
        
        // Rate limiting: wait 600ms between emails
        await new Promise(resolve => setTimeout(resolve, 600));
        
      } catch (emailError) {
        console.error(`[sendDeadlineWarnings] Error sending email to reviewer ${reviewerId}:`, emailError);
        errors.push(`Email error for reviewer ${reviewerId}: ${emailError instanceof Error ? emailError.message : String(emailError)}`);
      }
    }
    
    console.log(`[sendDeadlineWarnings] Successfully sent ${sentCount} warning emails`);
    
    return {
      sentCount,
      errors
    };
  } catch (error) {
    console.error('[sendDeadlineWarnings] Unexpected error:', error);
    errors.push(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
    return { sentCount: 0, errors };
  }
}
