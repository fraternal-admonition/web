/**
 * Cron Job: Send Deadline Warning Emails
 * 
 * This endpoint is called by cron-job.org every 6 hours to:
 * 1. Find assignments with deadlines in 23-24 hours
 * 2. Send warning emails to reviewers
 * 
 * Schedule: Every 6 hours (0 */6 * * *)
 * External Service: cron-job.org
 */

import { NextResponse } from 'next/server';
import { sendDeadlineWarnings } from '@/lib/peer-review/deadline-service';

export async function GET(request: Request) {
  console.log('[Cron] Peer review deadline warnings started');
  
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
    
    // Send deadline warning emails
    console.log('[Cron] Sending deadline warning emails...');
    const warningResult = await sendDeadlineWarnings();
    
    // Compile results
    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      warnings: {
        sent: warningResult.sentCount,
        errors: warningResult.errors
      }
    };
    
    console.log('[Cron] Deadline warnings complete:', result);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('[Cron] Error sending deadline warnings:', error);
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
