import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ScreeningResultsClient from './ScreeningResultsClient';
import LayoutWrapper from '@/components/LayoutWrapper';

export default async function ScreeningResultsPage({
    params,
}: {
    params: Promise<{ submissionId: string }>;
}) {
    const supabase = await createClient();
    const { submissionId } = await params;

    // Get current user
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect('/auth/signin');

    // Fetch submission with screening results
    const { data: submission } = await supabase
        .from('submissions')
        .select(
            `
      *,
      ai_screenings(*),
      contests(title)
    `
        )
        .eq('id', submissionId)
        .eq('user_id', user.id)
        .single();

    if (!submission) {
        redirect('/dashboard');
    }

    return (
        <LayoutWrapper>
            <ScreeningResultsClient initialSubmission={submission} />
        </LayoutWrapper>
    );
}
