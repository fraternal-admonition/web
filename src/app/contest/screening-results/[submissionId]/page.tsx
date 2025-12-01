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

    // Fetch submission with screening results and peer review data
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

    // Fetch peer review results if they exist
    let peerReviewData = null;
    if (submission && submission.score_peer) {
        // Get all completed reviews for this submission
        const { data: assignments } = await supabase
            .from('peer_review_assignments')
            .select(`
                id,
                peer_review_reviews(
                    clarity,
                    argument,
                    style,
                    moral_depth,
                    comment_100
                )
            `)
            .eq('submission_id', submissionId)
            .eq('status', 'DONE');

        if (assignments && assignments.length > 0) {
            // Extract reviews
            const reviews = assignments
                .map(a => a.peer_review_reviews)
                .filter(r => r !== null)
                .flat();

            if (reviews.length > 0) {
                // Calculate criterion means
                const calculateMean = (criterion: string) => {
                    const values = reviews.map((r: any) => r[criterion]);
                    if (values.length < 5) {
                        return values.reduce((sum: number, v: number) => sum + v, 0) / values.length;
                    }
                    // Trimmed mean for 5+ reviews
                    const sorted = [...values].sort((a, b) => a - b);
                    const trimmed = sorted.slice(1, -1);
                    return trimmed.reduce((sum: number, v: number) => sum + v, 0) / trimmed.length;
                };

                peerReviewData = {
                    peerScore: submission.score_peer,
                    criterionMeans: {
                        clarity: calculateMean('clarity'),
                        argument: calculateMean('argument'),
                        style: calculateMean('style'),
                        moral_depth: calculateMean('moral_depth')
                    },
                    reviewCount: reviews.length,
                    comments: reviews.map((r: any) => r.comment_100)
                };
            }
        }
    }

    if (!submission) {
        redirect('/dashboard');
    }

    return (
        <LayoutWrapper>
            <ScreeningResultsClient 
                initialSubmission={submission} 
                peerReviewData={peerReviewData}
            />
        </LayoutWrapper>
    );
}
