import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import EvaluationClient from './EvaluationClient';

export default async function EvaluationPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const supabase = await createClient();
  const { assignmentId } = await params;
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect('/auth/login');
  }

  // Fetch the assignment with submission data
  const { data: assignment, error: assignmentError } = await supabase
    .from('peer_assignments')
    .select(`
      id,
      submission_id,
      reviewer_user_id,
      status,
      assigned_at,
      deadline,
      submissions:submission_id (
        id,
        title,
        body_text
      )
    `)
    .eq('id', assignmentId)
    .single();

  // Verify user owns this assignment
  if (!assignment || assignment.reviewer_user_id !== user.id) {
    redirect('/dashboard/peer-verification-tasks');
  }

  // Verify assignment status is PENDING
  if (assignment.status !== 'PENDING') {
    redirect('/dashboard/peer-verification-tasks');
  }

  // Verify assignment has not expired
  const now = new Date();
  const deadline = new Date(assignment.deadline);
  if (deadline < now) {
    redirect('/dashboard/peer-verification-tasks');
  }

  // Handle submissions data structure (object or array)
  let submissionData: { id: string; title: string; body_text: string } | null = null;
  if (Array.isArray(assignment.submissions) && assignment.submissions.length > 0) {
    submissionData = assignment.submissions[0];
  } else if (assignment.submissions && typeof assignment.submissions === 'object' && !Array.isArray(assignment.submissions)) {
    submissionData = assignment.submissions as { id: string; title: string; body_text: string };
  }

  if (!submissionData) {
    redirect('/dashboard/peer-verification-tasks');
  }

  return (
    <EvaluationClient 
      assignment={{
        id: assignment.id,
        deadline: assignment.deadline,
        submission: {
          title: submissionData.title,
          body_text: submissionData.body_text,
        }
      }}
    />
  );
}
