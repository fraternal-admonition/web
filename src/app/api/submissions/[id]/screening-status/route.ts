import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { id } = await params;

        // Check authentication
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch submission with screening results
        const { data: submission, error } = await supabase
            .from('submissions')
            .select(
                `
                *,
                ai_screenings(*),
                contests(title)
            `
            )
            .eq('id', id)
            .eq('user_id', user.id)
            .single();

        if (error || !submission) {
            return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
        }

        return NextResponse.json(submission);
    } catch (error) {
        console.error('[API] Error fetching screening status:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
