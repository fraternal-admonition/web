import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PeerVerificationTasksClient from './PeerVerificationTasksClient';

export default async function PeerVerificationTasksPage() {
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect('/auth/login');
  }

  // Fetch assignments for this user
  const { data: rawAssignments, error: assignmentsError } = await supabase
    .from('peer_assignments')
    .select(`
      id,
      submission_id,
      reviewer_user_id,
      status,
      assigned_at,
      completed_at,
      deadline,
      submissions:submission_id (
        id,
        title,
        body_text,
        status,
        submission_code
      )
    `)
    .eq('reviewer_user_id', user.id)
    .order('assigned_at', { ascending: false });

  if (assignmentsError) {
    console.error('Error fetching assignments:', assignmentsError);
  }

  // Transform the data to match the expected interface
  // Supabase can return submissions as either an object or array depending on the relationship
  const assignments = (rawAssignments || []).map((assignment: any) => {
    let submissionsData = null;
    
    if (Array.isArray(assignment.submissions) && assignment.submissions.length > 0) {
      // If it's an array, take the first element
      submissionsData = assignment.submissions[0];
    } else if (assignment.submissions && typeof assignment.submissions === 'object') {
      // If it's already an object, use it directly
      submissionsData = assignment.submissions;
    }
    
    return {
      ...assignment,
      submissions: submissionsData
    };
  }).filter((assignment: any) => assignment.submissions !== null);

  // Get user data for integrity score
  const { data: userData } = await supabase
    .from('users')
    .select('integrity_score, qualified_evaluator')
    .eq('id', user.id)
    .single();

  return (
    <PeerVerificationTasksClient 
      assignments={assignments || []}
      user={userData || { integrity_score: 0, qualified_evaluator: false }}
    />
  );
}
