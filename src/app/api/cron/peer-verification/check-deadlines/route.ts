/**
 * Cron job to check and handle expired peer verification assignments
 * 
 * Schedule: Every hour (0 * * * *)
 * 
 * Actions:
 * 1. Mark expired assignments as EXPIRED
 * 2. Reassign expired assignments to new reviewers
 */

import { NextResponse } from 'next/server';
import { checkExpiredAssignments, reassignExpiredAssignments } from '@/lib/peer-verification/deadline-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    // Verify this is a cron request (Vercel sets this header)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.error('[check-deadlines] Unauthorized cron request');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[check-deadlines] Starting deadline check cron job');
    const startTime = Date.now();

    // Step 1: Check and mark expired assignments
    const expiredResult = await checkExpiredAssignments();
    console.log(`[check-deadlines] Expired assignments: ${expiredResult.expiredCount}`);

    // Step 2: Reassign expired assignments
    const reassignResult = await reassignExpiredAssignments();
    console.log(`[check-deadlines] Reassigned assignments: ${reassignResult.reassignedCount}`);

    const duration = Date.now() - startTime;

    const summary = {
      success: true,
      timestamp: new Date().toISOString(),
      duration_ms: duration,
      expired_count: expiredResult.expiredCount,
      reassigned_count: reassignResult.reassignedCount,
      errors: [...expiredResult.errors, ...reassignResult.errors]
    };

    console.log('[check-deadlines] Cron job completed:', summary);

    return NextResponse.json(summary);
  } catch (error) {
    console.error('[check-deadlines] Cron job failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
