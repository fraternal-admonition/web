import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ReviewClient from './ReviewClient';

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const { assignmentId } = await params;
  const supabase = await createClient();

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/auth/login');
  }

  // Fetch the assignment with submission data
  const { data: rawAssignment, error: assignmentError } = await supabase
    .from('peer_review_assignments')
    .select(`
      id,
      submission_id,
      reviewer_user_id,
      status,
      assigned_at,
      completed_at,
      deadline,
      submissions!peer_review_assignments_submission_id_fkey (
        id,
        submission_code,
        title,
        body_text
      )
    `)
    .eq('id', assignmentId)
    .single();

  if (assignmentError || !rawAssignment) {
    console.error('Error fetching assignment:', assignmentError);
    redirect('/dashboard/peer-review-tasks');
  }

  // Debug: Log the raw assignment data
  console.log('[Review Page] Raw assignment data:', JSON.stringify(rawAssignment, null, 2));

  // Verify user owns this assignment
  if (rawAssignment.reviewer_user_id !== user.id) {
    console.error('User does not own this assignment');
    redirect('/dashboard/peer-review-tasks');
  }

  // Verify assignment status is PENDING
  if (rawAssignment.status !== 'PENDING') {
    console.error('Assignment is not pending');
    redirect('/dashboard/peer-review-tasks');
  }

  // Verify assignment has not expired
  const deadline = new Date(rawAssignment.deadline);
  if (deadline < new Date()) {
    console.error('Assignment has expired');
    redirect('/dashboard/peer-review-tasks');
  }

  // Transform submission data
  let submissionData = null;
  if (Array.isArray(rawAssignment.submissions) && rawAssignment.submissions.length > 0) {
    submissionData = rawAssignment.submissions[0];
  } else if (rawAssignment.submissions && typeof rawAssignment.submissions === 'object') {
    submissionData = rawAssignment.submissions;
  }

  console.log('[Review Page] Submission data after transform:', submissionData);

  if (!submissionData) {
    console.error('[Review Page] No submission data found - rawAssignment.submissions:', rawAssignment.submissions);
    console.error('[Review Page] submission_id:', rawAssignment.submission_id);
    
    // Fallback: Fetch submission directly
    const { data: directSubmission, error: submissionError } = await supabase
      .from('submissions')
      .select('id, submission_code, title, body_text')
      .eq('id', rawAssignment.submission_id)
      .single();
    
    if (submissionError || !directSubmission) {
      console.error('[Review Page] Direct submission fetch also failed:', submissionError);
      redirect('/dashboard/peer-review-tasks');
    }
    
    console.log('[Review Page] Using direct submission fetch:', directSubmission);
    submissionData = directSubmission;
  }

  // Get total assignment count for this user
  const { data: allAssignments } = await supabase
    .from('peer_review_assignments')
    .select('id, status')
    .eq('reviewer_user_id', user.id);

  const totalAssignments = allAssignments?.length || 0;
  const completedCount = allAssignments?.filter(a => a.status === 'DONE').length || 0;
  const currentIndex = completedCount; // 0-indexed

  const assignment = {
    ...rawAssignment,
    submissions: submissionData
  };

  return (
    <ReviewClient
      assignment={assignment}
      currentIndex={currentIndex}
      totalAssignments={totalAssignments}
    />
  );
}
