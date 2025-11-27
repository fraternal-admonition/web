import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import PeerVerificationConfirmedClient from './PeerVerificationConfirmedClient';
import LayoutWrapper from '@/components/LayoutWrapper';

export default async function PeerVerificationConfirmedPage({
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

    // Fetch submission
    const { data: submission } = await supabase
        .from('submissions')
        .select('*, contests(title)')
        .eq('id', submissionId)
        .eq('user_id', user.id)
        .single();

    if (!submission) {
        redirect('/dashboard');
    }

    return (
        <LayoutWrapper>
            <PeerVerificationConfirmedClient submission={submission} />
        </LayoutWrapper>
    );
}
