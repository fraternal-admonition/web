/**
 * Cron job to send deadline warning and reminder emails
 * 
 * Schedule: Every 6 hours (0 */6 * * *)
 * 
 * Actions:
 * 1. Send 24-hour warning emails
 * 2. Send 2-hour final reminder emails
 */

import { NextResponse } from 'next/server';
import { sendDeadlineWarnings, sendFinalReminders } from '@/lib/peer-verification/deadline-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    // Verify this is a cron request (Vercel sets this header)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.error('[send-warnings] Unauthorized cron request');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[send-warnings] Starting deadline warnings cron job');
    const startTime = Date.now();

    // Step 1: Send 24-hour warning emails
    const warningsResult = await sendDeadlineWarnings();
    console.log(`[send-warnings] Warning emails sent: ${warningsResult.sentCount}`);

    // Step 2: Send 2-hour final reminder emails
    const remindersResult = await sendFinalReminders();
    console.log(`[send-warnings] Final reminder emails sent: ${remindersResult.sentCount}`);

    const duration = Date.now() - startTime;

    const summary = {
      success: true,
      timestamp: new Date().toISOString(),
      duration_ms: duration,
      warnings_sent: warningsResult.sentCount,
      reminders_sent: remindersResult.sentCount,
      errors: [...warningsResult.errors, ...remindersResult.errors]
    };

    console.log('[send-warnings] Cron job completed:', summary);

    return NextResponse.json(summary);
  } catch (error) {
    console.error('[send-warnings] Cron job failed:', error);
    
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
