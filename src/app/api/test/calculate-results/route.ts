import { NextResponse } from 'next/server';
import { calculateResults } from '@/lib/peer-verification/results-service';

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

        console.log(`[Test] Manually triggering result calculation for ${submissionId}`);

        await calculateResults(submissionId);

        return NextResponse.json({
            success: true,
            message: 'Calculation completed successfully'
        });

    } catch (error) {
        console.error('[Test] Error:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
