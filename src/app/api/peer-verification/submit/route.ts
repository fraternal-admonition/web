import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
  validateEvaluation,
  submitEvaluation,
  checkVerificationCompletion,
  triggerResultsCalculation,
} from '@/lib/peer-verification/evaluation-service';

// Store last submission timestamps per user (in-memory for now)
// In production, this should use Redis or database
const lastSubmissionTimes = new Map<string, number>();

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Verify user authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { assignment_id, decision, comment } = body;

    // Validate request body
    if (!assignment_id || !decision || !comment) {
      return NextResponse.json(
        { error: 'Missing required fields: assignment_id, decision, comment' },
        { status: 400 }
      );
    }

    if (decision !== 'ELIMINATE' && decision !== 'REINSTATE') {
      return NextResponse.json(
        { error: 'Invalid decision. Must be ELIMINATE or REINSTATE' },
        { status: 400 }
      );
    }

    if (typeof comment !== 'string' || comment.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment must be a non-empty string' },
        { status: 400 }
      );
    }

    if (comment.length > 100) {
      return NextResponse.json(
        { error: 'Comment must be 100 characters or less' },
        { status: 400 }
      );
    }

    // Rate limiting: Check 10-second minimum delay between submissions
    const lastSubmissionTime = lastSubmissionTimes.get(user.id);
    const now = Date.now();

    if (lastSubmissionTime && now - lastSubmissionTime < 10000) {
      const remainingSeconds = Math.ceil((10000 - (now - lastSubmissionTime)) / 1000);
      return NextResponse.json(
        {
          error: `Please wait ${remainingSeconds} seconds between submissions`,
        },
        { status: 429 }
      );
    }

    // Validate evaluation
    const validation = await validateEvaluation(assignment_id, user.id);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 403 });
    }

    // Get assignment to find submission_id
    const { data: assignment } = await supabase
      .from('peer_assignments')
      .select('submission_id')
      .eq('id', assignment_id)
      .single();

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Submit evaluation
    await submitEvaluation(assignment_id, decision, comment.trim());

    // Update last submission time
    lastSubmissionTimes.set(user.id, now);

    // Check if verification is complete
    const completion = await checkVerificationCompletion(assignment.submission_id);

    // If all reviews are complete, trigger results calculation
    if (completion.complete) {
      console.log('All reviews complete, triggering results calculation');
      // Trigger asynchronously (don't wait for it)
      triggerResultsCalculation(assignment.submission_id).catch((err) => {
        console.error('Error triggering results calculation:', err);
      });
    }

    return NextResponse.json({
      success: true,
      completion: {
        complete: completion.complete,
        completedCount: completion.completedCount,
        totalCount: completion.totalCount,
      },
    });
  } catch (error) {
    console.error('Error submitting evaluation:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to submit evaluation',
      },
      { status: 500 }
    );
  }
}
