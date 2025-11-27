import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: submissionId } = await params;

        // Verify user authentication
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Verify user owns this submission
        const { data: submission, error: submissionError } = await supabase
            .from('submissions')
            .select('user_id, status')
            .eq('id', submissionId)
            .single();

        if (submissionError || !submission) {
            return NextResponse.json(
                { error: 'Submission not found' },
                { status: 404 }
            );
        }

        if (submission.user_id !== user.id) {
            return NextResponse.json(
                { error: 'Unauthorized - not your submission' },
                { status: 403 }
            );
        }

        // Verify submission is currently ELIMINATED
        if (submission.status !== 'ELIMINATED') {
            return NextResponse.json(
                { error: 'Submission is not in ELIMINATED status' },
                { status: 400 }
            );
        }

        // Update submission status to ELIMINATED_ACCEPTED
        const adminSupabase = await createAdminClient();
        const { error: updateError } = await adminSupabase
            .from('submissions')
            .update({ 
                status: 'ELIMINATED_ACCEPTED',
                updated_at: new Date().toISOString()
            })
            .eq('id', submissionId);

        if (updateError) {
            console.error('Error updating submission status:', updateError);
            return NextResponse.json(
                { error: 'Failed to update submission status' },
                { status: 500 }
            );
        }

        return NextResponse.json({ 
            success: true,
            message: 'Elimination accepted successfully'
        });

    } catch (error) {
        console.error('Error in accept-elimination route:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
