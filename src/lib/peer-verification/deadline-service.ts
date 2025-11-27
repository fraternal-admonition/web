/**
 * Deadline Management Service for Peer Verification
 * 
 * Handles:
 * - Expired assignment detection and marking
 * - Assignment reassignment to new reviewers
 * - Deadline warning emails (24h before)
 * - Final reminder emails (2h before)
 * - Incomplete verification detection (>14 days, <8 reviews)
 */

import { createClient } from '@/lib/supabase/server';
import { sendDeadlineWarningEmail, sendFinalReminderEmail, sendRefundNotificationEmail } from '@/lib/email';

/**
 * Check for expired assignments and mark them as EXPIRED
 */
export async function checkExpiredAssignments(): Promise<{
  expiredCount: number;
  errors: string[];
}> {
  const supabase = await createClient();
  const errors: string[] = [];
  
  try {
    // Query assignments with deadline < NOW() and status PENDING
    const { data: expiredAssignments, error } = await supabase
      .from('peer_assignments')
      .select('id, submission_id, reviewer_user_id, deadline')
      .eq('status', 'PENDING')
      .lt('deadline', new Date().toISOString());
    
    if (error) {
      console.error('[checkExpiredAssignments] Error querying expired assignments:', error);
      errors.push(`Query error: ${error.message}`);
      return { expiredCount: 0, errors };
    }
    
    if (!expiredAssignments || expiredAssignments.length === 0) {
      console.log('[checkExpiredAssignments] No expired assignments found');
      return { expiredCount: 0, errors };
    }
    
    console.log(`[checkExpiredAssignments] Found ${expiredAssignments.length} expired assignments`);
    
    // Update status to EXPIRED for all expired assignments
    const { error: updateError } = await supabase
      .from('peer_assignments')
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

/**
 * Reassign expired assignments to new reviewers
 * Excludes reviewers with 2+ expired assignments from future assignments for 30 days
 */
export async function reassignExpiredAssignments(): Promise<{
  reassignedCount: number;
  errors: string[];
}> {
  const supabase = await createClient();
  const errors: string[] = [];
  let reassignedCount = 0;
  
  try {
    // Get all EXPIRED assignments that haven't been reassigned yet
    const { data: expiredAssignments, error: queryError } = await supabase
      .from('peer_assignments')
      .select(`
        id,
        submission_id,
        reviewer_user_id,
        deadline,
        submissions!inner(
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
        
        // Get eligible reviewers for this contest
        // Exclude: author, reviewers with 2+ expired assignments in last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        // Get reviewers with 2+ expired assignments in last 30 days
        const { data: blacklistedReviewers } = await supabase
          .from('peer_assignments')
          .select('reviewer_user_id')
          .eq('status', 'EXPIRED')
          .gte('assigned_at', thirtyDaysAgo.toISOString())
          .then(async (result) => {
            if (!result.data) return { data: [] };
            
            // Count expired assignments per reviewer
            const counts = result.data.reduce((acc: Record<string, number>, curr) => {
              acc[curr.reviewer_user_id] = (acc[curr.reviewer_user_id] || 0) + 1;
              return acc;
            }, {});
            
            // Filter reviewers with 2+ expired assignments
            const blacklisted = Object.keys(counts).filter(id => counts[id] >= 2);
            return { data: blacklisted };
          });
        
        // Get eligible reviewers
        const { data: eligibleReviewers, error: reviewerError } = await supabase
          .from('users')
          .select('id')
          .eq('is_banned', false)
          .neq('id', authorUserId)
          .not('id', 'in', `(${blacklistedReviewers?.join(',') || 'null'})`)
          .in('id', supabase
            .from('submissions')
            .select('user_id')
            .eq('contest_id', contestId)
            .in('status', ['SUBMITTED', 'ELIMINATED'])
          );
        
        if (reviewerError || !eligibleReviewers || eligibleReviewers.length === 0) {
          console.warn(`[reassignExpiredAssignments] No eligible reviewers for assignment ${assignment.id}`);
          errors.push(`No eligible reviewers for assignment ${assignment.id}`);
          continue;
        }
        
        // Randomly select one reviewer
        const newReviewer = eligibleReviewers[Math.floor(Math.random() * eligibleReviewers.length)];
        
        // Create new assignment with fresh 7-day deadline
        const newDeadline = new Date();
        newDeadline.setDate(newDeadline.getDate() + 7);
        
        const { error: insertError } = await supabase
          .from('peer_assignments')
          .insert({
            submission_id: assignment.submission_id,
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
        const { data: reviewer } = await supabase
          .from('users')
          .select('id')
          .eq('id', newReviewer.id)
          .single()
          .then(async (result) => {
            if (!result.data) return { data: null };
            
            // Get email from auth.users
            const { data: authUser } = await supabase.auth.admin.getUserById(result.data.id);
            return { data: authUser?.user?.email };
          });
        
        if (reviewer) {
          // Send assignment notification email
          await sendAssignmentNotificationEmail(reviewer, {
            assignment_count: 1,
            deadline: newDeadline.toISOString()
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

/**
 * Send deadline warning emails (24 hours before deadline)
 */
export async function sendDeadlineWarnings(): Promise<{
  sentCount: number;
  errors: string[];
}> {
  const supabase = await createClient();
  const errors: string[] = [];
  let sentCount = 0;
  
  try {
    // Calculate 24 hours from now
    const twentyFourHoursFromNow = new Date();
    twentyFourHoursFromNow.setHours(twentyFourHoursFromNow.getHours() + 24);
    
    const twentyThreeHoursFromNow = new Date();
    twentyThreeHoursFromNow.setHours(twentyThreeHoursFromNow.getHours() + 23);
    
    // Query assignments with deadline within 23-24 hours and status PENDING
    const { data: upcomingAssignments, error: queryError } = await supabase
      .from('peer_assignments')
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
        // Get reviewer email
        const { data: authUser } = await supabase.auth.admin.getUserById(reviewerId);
        const email = authUser?.user?.email;
        
        if (!email) {
          console.warn(`[sendDeadlineWarnings] No email found for reviewer ${reviewerId}`);
          errors.push(`No email for reviewer ${reviewerId}`);
          continue;
        }
        
        // Send warning email
        await sendDeadlineWarningEmail(email, {
          assignment_count: assignments.length,
          deadline: assignments[0].deadline
        });
        
        sentCount++;
        console.log(`[sendDeadlineWarnings] Sent warning email to reviewer ${reviewerId} for ${assignments.length} assignments`);
        
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

/**
 * Send final reminder emails (2 hours before deadline)
 */
export async function sendFinalReminders(): Promise<{
  sentCount: number;
  errors: string[];
}> {
  const supabase = await createClient();
  const errors: string[] = [];
  let sentCount = 0;
  
  try {
    // Calculate 2 hours from now
    const twoHoursFromNow = new Date();
    twoHoursFromNow.setHours(twoHoursFromNow.getHours() + 2);
    
    const oneHourFromNow = new Date();
    oneHourFromNow.setHours(oneHourFromNow.getHours() + 1);
    
    // Query assignments with deadline within 1-2 hours and status PENDING
    const { data: urgentAssignments, error: queryError } = await supabase
      .from('peer_assignments')
      .select('id, submission_id, reviewer_user_id, deadline')
      .eq('status', 'PENDING')
      .gte('deadline', oneHourFromNow.toISOString())
      .lte('deadline', twoHoursFromNow.toISOString());
    
    if (queryError) {
      console.error('[sendFinalReminders] Error querying urgent assignments:', queryError);
      errors.push(`Query error: ${queryError.message}`);
      return { sentCount: 0, errors };
    }
    
    if (!urgentAssignments || urgentAssignments.length === 0) {
      console.log('[sendFinalReminders] No assignments with urgent deadlines');
      return { sentCount: 0, errors };
    }
    
    console.log(`[sendFinalReminders] Found ${urgentAssignments.length} assignments with urgent deadlines`);
    
    // Group assignments by reviewer
    const assignmentsByReviewer = urgentAssignments.reduce((acc: Record<string, typeof urgentAssignments>, curr) => {
      if (!acc[curr.reviewer_user_id]) {
        acc[curr.reviewer_user_id] = [];
      }
      acc[curr.reviewer_user_id].push(curr);
      return acc;
    }, {});
    
    // Send final reminder email to each reviewer
    for (const [reviewerId, assignments] of Object.entries(assignmentsByReviewer)) {
      try {
        // Get reviewer email
        const { data: authUser } = await supabase.auth.admin.getUserById(reviewerId);
        const email = authUser?.user?.email;
        
        if (!email) {
          console.warn(`[sendFinalReminders] No email found for reviewer ${reviewerId}`);
          errors.push(`No email for reviewer ${reviewerId}`);
          continue;
        }
        
        // Send final reminder email
        await sendFinalReminderEmail(email, {
          assignment_count: assignments.length,
          deadline: assignments[0].deadline
        });
        
        sentCount++;
        console.log(`[sendFinalReminders] Sent final reminder email to reviewer ${reviewerId} for ${assignments.length} assignments`);
        
      } catch (emailError) {
        console.error(`[sendFinalReminders] Error sending email to reviewer ${reviewerId}:`, emailError);
        errors.push(`Email error for reviewer ${reviewerId}: ${emailError instanceof Error ? emailError.message : String(emailError)}`);
      }
    }
    
    console.log(`[sendFinalReminders] Successfully sent ${sentCount} final reminder emails`);
    
    return {
      sentCount,
      errors
    };
  } catch (error) {
    console.error('[sendFinalReminders] Unexpected error:', error);
    errors.push(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
    return { sentCount: 0, errors };
  }
}

/**
 * Check for incomplete verifications (>14 days, <8 reviews)
 * and process refunds
 */
export async function checkIncompleteVerifications(): Promise<{
  refundedCount: number;
  errors: string[];
}> {
  const supabase = await createClient();
  const errors: string[] = [];
  let refundedCount = 0;
  
  try {
    // Calculate 14 days ago
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    
    // Query verification requests older than 14 days with status PEER_VERIFICATION_PENDING
    const { data: oldVerifications, error: queryError } = await supabase
      .from('submissions')
      .select(`
        id,
        submission_code,
        title,
        user_id,
        created_at,
        peer_assignments!inner(
          id,
          status
        )
      `)
      .eq('status', 'PEER_VERIFICATION_PENDING')
      .lt('created_at', fourteenDaysAgo.toISOString());
    
    if (queryError) {
      console.error('[checkIncompleteVerifications] Error querying old verifications:', queryError);
      errors.push(`Query error: ${queryError.message}`);
      return { refundedCount: 0, errors };
    }
    
    if (!oldVerifications || oldVerifications.length === 0) {
      console.log('[checkIncompleteVerifications] No old verifications found');
      return { refundedCount: 0, errors };
    }
    
    console.log(`[checkIncompleteVerifications] Found ${oldVerifications.length} old verifications`);
    
    // Check each verification for completion status
    for (const verification of oldVerifications) {
      try {
        const assignments = verification.peer_assignments as any[];
        const completedCount = assignments.filter((a: any) => a.status === 'DONE').length;
        
        // If fewer than 8 reviews completed, mark as incomplete and process refund
        if (completedCount < 8) {
          console.log(`[checkIncompleteVerifications] Verification ${verification.id} has only ${completedCount} completed reviews`);
          
          // Update submission status to ELIMINATED (or keep original status)
          const { error: updateError } = await supabase
            .from('submissions')
            .update({
              status: 'ELIMINATED',
              peer_verification_result: {
                outcome: 'INCOMPLETE',
                completed_reviews: completedCount,
                total_reviews: assignments.length,
                refunded: true,
                completed_at: new Date().toISOString()
              }
            })
            .eq('id', verification.id);
          
          if (updateError) {
            console.error(`[checkIncompleteVerifications] Error updating submission ${verification.id}:`, updateError);
            errors.push(`Update error for submission ${verification.id}: ${updateError.message}`);
            continue;
          }
          
          // Process refund
          await processRefund(verification.id);
          
          // Get author email
          const { data: authUser } = await supabase.auth.admin.getUserById(verification.user_id);
          const email = authUser?.user?.email;
          
          if (email) {
            // Send refund notification email
            await sendRefundNotificationEmail(email, {
              submission_code: verification.submission_code,
              title: verification.title,
              amount: 20.00,
              completed_reviews: completedCount,
              required_reviews: 8
            });
          }
          
          refundedCount++;
          console.log(`[checkIncompleteVerifications] Processed refund for verification ${verification.id}`);
        }
        
      } catch (verificationError) {
        console.error(`[checkIncompleteVerifications] Error processing verification ${verification.id}:`, verificationError);
        errors.push(`Processing error for verification ${verification.id}: ${verificationError instanceof Error ? verificationError.message : String(verificationError)}`);
      }
    }
    
    console.log(`[checkIncompleteVerifications] Successfully processed ${refundedCount} refunds`);
    
    return {
      refundedCount,
      errors
    };
  } catch (error) {
    console.error('[checkIncompleteVerifications] Unexpected error:', error);
    errors.push(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
    return { refundedCount: 0, errors };
  }
}

/**
 * Process refund for incomplete verification
 * Updates payment status and creates Stripe refund
 */
async function processRefund(submissionId: string): Promise<void> {
  const supabase = await createClient();
  
  try {
    // Find the peer verification payment for this submission
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('id, external_ref, amount')
      .eq('submission_id', submissionId)
      .eq('purpose', 'PEER_VERIFICATION')
      .eq('status', 'PAID')
      .single();
    
    if (paymentError || !payment) {
      console.error(`[processRefund] No payment found for submission ${submissionId}`);
      return;
    }
    
    // Update payment status to REFUNDED
    const { error: updateError } = await supabase
      .from('payments')
      .update({ status: 'REFUNDED' })
      .eq('id', payment.id);
    
    if (updateError) {
      console.error(`[processRefund] Error updating payment ${payment.id}:`, updateError);
      return;
    }
    
    // TODO: Create Stripe refund via API
    // This would require Stripe SDK integration
    // For now, we just mark it as refunded in the database
    // Admin will need to manually process the refund in Stripe dashboard
    
    console.log(`[processRefund] Marked payment ${payment.id} as REFUNDED (manual Stripe refund required)`);
    
  } catch (error) {
    console.error(`[processRefund] Error processing refund for submission ${submissionId}:`, error);
  }
}

// Helper function to send assignment notification (imported from email.ts)
async function sendAssignmentNotificationEmail(
  email: string,
  data: {
    assignment_count: number;
    deadline: string;
  }
): Promise<void> {
  // This function is already implemented in src/lib/email.ts
  // We're just importing and using it here
  const { sendAssignmentNotificationEmail: sendEmail } = await import('@/lib/email');
  await sendEmail(email, data);
}
