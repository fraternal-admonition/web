import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

    // Fetch assignments for this user
    const { data: assignments, error: assignmentsError } = await supabase
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
      return NextResponse.json(
        { error: 'Failed to fetch assignments' },
        { status: 500 }
      );
    }

    // Sanitize data - remove AI screening info and author identity
    const sanitizedAssignments = (assignments || []).map(assignment => {
      const submission = Array.isArray(assignment.submissions) 
        ? assignment.submissions[0] 
        : assignment.submissions;
      
      return {
        id: assignment.id,
        submission_id: assignment.submission_id,
        reviewer_user_id: assignment.reviewer_user_id,
        status: assignment.status,
        assigned_at: assignment.assigned_at,
        completed_at: assignment.completed_at,
        deadline: assignment.deadline,
        submissions: submission ? {
          id: submission.id,
          title: submission.title,
          body_text: submission.body_text,
          submission_code: submission.submission_code,
          // Explicitly exclude status to maintain blind review
        } : null
      };
    });

    // Group by status
    const grouped = {
      pending: sanitizedAssignments.filter(a => a.status === 'PENDING'),
      done: sanitizedAssignments.filter(a => a.status === 'DONE'),
      expired: sanitizedAssignments.filter(a => a.status === 'EXPIRED'),
    };

    return NextResponse.json({
      success: true,
      assignments: sanitizedAssignments,
      grouped,
    });
  } catch (error) {
    console.error('Error in assignments API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
