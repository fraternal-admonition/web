import { NextResponse } from 'next/server';
import { executeImmediateAssignment } from '@/lib/peer-verification/immediate-assignment-service';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    const { submissionId } = await request.json();

    if (!submissionId) {
      return NextResponse.json({ error: 'submissionId is required' }, { status: 400 });
    }

    console.log(`[Test] Manually triggering assignment for ${submissionId}`);

    const adminSupabase = await createAdminClient();

    // 1. Deep cleanup: Delete ALL assignments for this contest to avoid duplicates with control submissions
    // First get the contest_id
    const { data: submission } = await adminSupabase
      .from('submissions')
      .select('contest_id')
      .eq('id', submissionId)
      .single();

    if (submission) {
      // Find all submissions in this contest
      const { data: contestSubmissions } = await adminSupabase
        .from('submissions')
        .select('id')
        .eq('contest_id', submission.contest_id);

      if (contestSubmissions && contestSubmissions.length > 0) {
        const submissionIds = contestSubmissions.map(s => s.id);

        const { error: cleanupError } = await adminSupabase
          .from('peer_assignments')
          .delete()
          .in('submission_id', submissionIds);

        if (cleanupError) {
          console.warn('[Test] Warning: Failed to cleanup contest assignments:', cleanupError);
        } else {
          console.log(`[Test] Cleaned up assignments for ${submissionIds.length} submissions in contest`);
        }
      }
    }

    // 2. Update submission status to PEER_VERIFICATION_PENDING
    const { error: updateError } = await adminSupabase
      .from('submissions')
      .update({
        status: 'PEER_VERIFICATION_PENDING',
        updated_at: new Date().toISOString(),
      })
      .eq('id', submissionId);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update status: ' + updateError.message }, { status: 500 });
    }

    // 3. Execute assignment
    const result = await executeImmediateAssignment(submissionId);

    return NextResponse.json({
      success: true,
      result
    });

  } catch (error) {
    console.error('[Test] Error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
