import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/peer-review/assignments
 * 
 * Fetch peer review assignments for the authenticated user
 * Returns assignments grouped by status with related submission data
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Step 1: Fetch assignments for this user (basic data only)
    console.log(`[Assignments API] Fetching assignments for user: ${user.id}`);
    
    const { data: rawAssignments, error: assignmentsError } = await supabase
      .from('peer_review_assignments')
      .select('id, submission_id, reviewer_user_id, status, assigned_at, completed_at, deadline')
      .eq('reviewer_user_id', user.id)
      .order('assigned_at', { ascending: false });

    if (assignmentsError) {
      console.error('Error fetching assignments:', assignmentsError);
      return NextResponse.json(
        { error: 'Failed to fetch assignments' },
        { status: 500 }
      );
    }

    console.log(`[Assignments API] Raw assignments fetched: ${rawAssignments?.length || 0}`);

    if (!rawAssignments || rawAssignments.length === 0) {
      return NextResponse.json({
        success: true,
        assignments: { pending: [], done: [], expired: [] },
        total: 0
      });
    }

    // Step 2: Use admin client to fetch submission data (bypasses RLS)
    const adminSupabase = await createAdminClient();
    const submissionIds = rawAssignments.map((a: any) => a.submission_id);
    
    const { data: submissions, error: submissionsError } = await adminSupabase
      .from('submissions')
      .select('id, submission_code, title, body_text, status')
      .in('id', submissionIds);

    if (submissionsError) {
      console.error('Error fetching submissions:', submissionsError);
      return NextResponse.json(
        { error: 'Failed to fetch submission data' },
        { status: 500 }
      );
    }

    console.log(`[Assignments API] Submissions fetched: ${submissions?.length || 0}`);

    // Step 3: Fetch reviews for completed assignments
    const { data: reviews, error: reviewsError } = await supabase
      .from('peer_review_reviews')
      .select('*')
      .in('assignment_id', rawAssignments.map((a: any) => a.id));

    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError);
    }

    console.log(`[Assignments API] Reviews fetched: ${reviews?.length || 0}`);

    // Step 4: Create lookup maps
    const submissionMap = new Map(submissions?.map(s => [s.id, s]) || []);
    const reviewMap = new Map(reviews?.map(r => [r.assignment_id, r]) || []);

    // Step 5: Combine data
    const assignments = rawAssignments.map((assignment: any) => {
      const submissionData = submissionMap.get(assignment.submission_id);
      const reviewData = reviewMap.get(assignment.id);

      return {
        ...assignment,
        submissions: submissionData || null,
        peer_review_reviews: reviewData || null
      };
    }).filter((assignment: any) => assignment.submissions !== null);

    console.log(`[Assignments API] Final assignments with data: ${assignments.length}`);

    // Step 6: Group by status
    const grouped = {
      pending: assignments.filter((a: any) => a.status === 'PENDING'),
      done: assignments.filter((a: any) => a.status === 'DONE'),
      expired: assignments.filter((a: any) => a.status === 'EXPIRED')
    };

    console.log(`[Assignments API] Grouped - Pending: ${grouped.pending.length}, Done: ${grouped.done.length}, Expired: ${grouped.expired.length}`);

    return NextResponse.json({
      success: true,
      assignments: grouped,
      total: assignments.length
    });

  } catch (error) {
    console.error('Error in assignments API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
