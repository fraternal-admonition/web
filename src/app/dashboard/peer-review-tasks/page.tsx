import { redirect } from 'next/navigation';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import PeerReviewTasksClient from './PeerReviewTasksClient';

export default async function PeerReviewTasksPage() {
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect('/auth/login');
  }

  // Check if any contest is in PEER_REVIEW phase
  const { data: contests } = await supabase
    .from('contests')
    .select('id, phase')
    .eq('phase', 'PEER_REVIEW')
    .limit(1);

  // If no contest is in PEER_REVIEW phase, redirect to dashboard
  if (!contests || contests.length === 0) {
    redirect('/dashboard');
  }

  // Fetch peer review assignments for this user (Phase 5)
  console.log(`[Peer Review Tasks] Fetching assignments for user: ${user.id}`);
  
  const { data: rawAssignments, error: assignmentsError } = await supabase
    .from('peer_review_assignments')
    .select('id, submission_id, reviewer_user_id, status, assigned_at, completed_at, deadline')
    .eq('reviewer_user_id', user.id)
    .order('assigned_at', { ascending: false });

  if (assignmentsError) {
    console.error('Error fetching peer review assignments:', assignmentsError);
  }

  console.log(`[Peer Review Tasks] Raw assignments fetched: ${rawAssignments?.length || 0}`);

  let assignments: any[] = [];

  if (rawAssignments && rawAssignments.length > 0) {
    // Use admin client to fetch submission data (bypasses RLS)
    const adminSupabase = await createAdminClient();
    const submissionIds = rawAssignments.map((a: any) => a.submission_id);
    
    const { data: submissions, error: submissionsError } = await adminSupabase
      .from('submissions')
      .select('id, submission_code, title, body_text, status')
      .in('id', submissionIds);

    if (submissionsError) {
      console.error('Error fetching submissions:', submissionsError);
    }

    console.log(`[Peer Review Tasks] Submissions fetched: ${submissions?.length || 0}`);

    // Fetch reviews for completed assignments
    const { data: reviews, error: reviewsError } = await supabase
      .from('peer_review_reviews')
      .select('*')
      .in('assignment_id', rawAssignments.map((a: any) => a.id));

    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError);
    }

    console.log(`[Peer Review Tasks] Reviews fetched: ${reviews?.length || 0}`);

    // Create lookup maps
    const submissionMap = new Map(submissions?.map(s => [s.id, s]) || []);
    const reviewMap = new Map(reviews?.map(r => [r.assignment_id, r]) || []);

    // Combine data
    assignments = rawAssignments.map((assignment: any) => {
      const submissionData = submissionMap.get(assignment.submission_id);
      const reviewData = reviewMap.get(assignment.id);

      return {
        ...assignment,
        submissions: submissionData || null,
        peer_review_reviews: reviewData || null
      };
    }).filter((assignment: any) => assignment.submissions !== null);

    console.log(`[Peer Review Tasks] Final assignments with data: ${assignments.length}`);
  }

  return (
    <PeerReviewTasksClient 
      assignments={assignments || []}
    />
  );
}
