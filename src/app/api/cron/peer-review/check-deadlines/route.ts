/**
 * Cron Job: Check Expired Assignments and Reassign
 * 
 * This endpoint is called by cron-job.org every hour to:
 * 1. Mark expired assignments as EXPIRED
 * 2. Reassign expired assignments to new reviewers
 * 
 * Schedule: Every hour (0 * * * *)
 * External Service: cron-job.org
 */

import { NextResponse } from 'next/server';
import { checkExpiredAssignments, reassignExpiredAssignments } from '@/lib/peer-review/deadline-service';

export async function GET(request: Request) {
  console.log('[Cron] Peer review deadline check started');
  
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret) {
      console.error('[Cron] CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Cron secret not configured' },
        { status: 500 }
      );
    }
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('[Cron] Unauthorized cron request');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Step 1: Check and mark expired assignments
    console.log('[Cron] Checking for expired assignments...');
    const expiredResult = await checkExpiredAssignments();
    
    // Step 2: Reassign expired assignments
    console.log('[Cron] Reassigning expired assignments...');
    const reassignResult = await reassignExpiredAssignments();
    
    // Compile results
    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      expired: {
        count: expiredResult.expiredCount,
        errors: expiredResult.errors
      },
      reassigned: {
        count: reassignResult.reassignedCount,
        errors: reassignResult.errors
      }
    };
    
    console.log('[Cron] Deadline check complete:', result);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('[Cron] Error in deadline check:', error);
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
