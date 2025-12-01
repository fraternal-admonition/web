/**
 * Peer Review Phase 5 - Review Submission API
 * 
 * POST /api/peer-review/submit
 * 
 * Handles the submission of peer reviews by reviewers.
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import {
  submitReview,
  validateReview,
  checkSubmissionReviewCompletion,
  triggerScoreCalculation
} from '@/lib/peer-review/review-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ReviewSubmissionRequest {
  assignment_id: string;
  clarity: number;
  argument: number;
  style: number;
  moral_depth: number;
  comment: string;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse request body
    const body: ReviewSubmissionRequest = await request.json();
    const { assignment_id, clarity, argument, style, moral_depth, comment } = body;

    // 3. Validate required fields
    if (!assignment_id || !comment) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 4. Validate scores are between 1 and 5
    const scores = [clarity, argument, style, moral_depth];
    if (scores.some(s => typeof s !== 'number' || s < 1 || s > 5)) {
      return NextResponse.json(
        { error: 'All scores must be between 1 and 5' },
        { status: 400 }
      );
    }

    // 5. Validate comment length
    if (comment.length > 100) {
      return NextResponse.json(
        { error: 'Comment must be 100 characters or less' },
        { status: 400 }
      );
    }

    // 6. Validate review submission
    const validation = await validateReview(assignment_id, user.id);
    if (!validation.valid) {
      console.log(`Review validation failed for user ${user.id}: ${validation.error}`);
      return NextResponse.json(
        { error: validation.error },
        { status: 403 }
      );
    }

    // 7. Submit the review
    await submitReview(
      assignment_id,
      user.id,
      { clarity, argument, style, moral_depth },
      comment
    );

    console.log(`✓ Review submitted by user ${user.id} for assignment ${assignment_id}`);

    // 8. Get the submission_id from the assignment
    const { data: assignment } = await supabase
      .from('peer_review_assignments')
      .select('submission_id')
      .eq('id', assignment_id)
      .single();

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    // 9. Check if all reviews are complete for this submission
    console.log(`🔍 Checking completion status for submission ${assignment.submission_id}`);
    const completion = await checkSubmissionReviewCompletion(assignment.submission_id);
    console.log(`📊 Completion check result:`, {
      complete: completion.complete,
      reviewCount: completion.reviewCount,
      totalExpected: completion.totalExpected,
      submissionId: assignment.submission_id
    });

    // 10. If all reviews complete, trigger score calculation asynchronously
    if (completion.complete) {
      console.log(`✅ All reviews complete for submission ${assignment.submission_id}, triggering score calculation`);
      triggerScoreCalculation(assignment.submission_id).catch(err => {
        console.error('❌ Error triggering score calculation:', err);
      });
    } else {
      console.log(`⏳ Not all reviews complete yet: ${completion.reviewCount}/${completion.totalExpected} done`);
    }

    return NextResponse.json({
      success: true,
      completion: {
        complete: completion.complete,
        reviewCount: completion.reviewCount,
        totalExpected: completion.totalExpected
      }
    });
  } catch (error) {
    console.error('Error in review submission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
