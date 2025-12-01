import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin-auth';
import PeerReviewConfig from '@/components/admin/PeerReviewConfig';
import PhaseEndButton from '@/components/admin/PhaseEndButton';
import Link from 'next/link';

export default async function AdminPeerReviewPage({
    searchParams,
}: {
    searchParams: Promise<{ contestId?: string }>;
}) {
    // Verify admin authentication
    await requireAdmin();

    const { contestId } = await searchParams;

    const supabase = await createClient();

    // If no contestId provided, try to get the first active contest
    let activeContestId = contestId;
    if (!activeContestId) {
        const { data: contests } = await supabase
            .from('contests')
            .select('id, phase')
            .eq('phase', 'PEER_REVIEW')
            .order('created_at', { ascending: false })
            .limit(1);
        
        if (contests && contests.length > 0) {
            activeContestId = contests[0].id;
        }
    }

    // Fetch contest details for configuration
    let contest = null;
    let votingRules: any = {};
    if (activeContestId) {
        const { data: contestData } = await supabase
            .from('contests')
            .select('id, title, phase, voting_rules')
            .eq('id', activeContestId)
            .single();
        
        contest = contestData;
        votingRules = contestData?.voting_rules || {};
    }

    // Fetch peer review statistics
    let assignmentsQuery = supabase
        .from('peer_review_assignments')
        .select('id, status, reviewer_user_id, submission_id, deadline');
    
    // Filter by contest if we have one
    if (activeContestId) {
        // Get submissions for this contest first
        const { data: contestSubmissions } = await supabase
            .from('submissions')
            .select('id')
            .eq('contest_id', activeContestId);
        
        const submissionIds = contestSubmissions?.map(s => s.id) || [];
        
        if (submissionIds.length > 0) {
            assignmentsQuery = assignmentsQuery.in('submission_id', submissionIds);
        }
    }

    const { data: assignments } = await assignmentsQuery;

    const totalAssignments = assignments?.length || 0;
    const completedReviews = assignments?.filter(a => a.status === 'DONE').length || 0;
    const pendingReviews = assignments?.filter(a => a.status === 'PENDING').length || 0;
    const expiredReviews = assignments?.filter(a => a.status === 'EXPIRED').length || 0;

    // Calculate at-risk reviewers (pending assignments with deadline within 24 hours)
    const now = new Date();
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const atRiskAssignments = assignments?.filter(
        a => a.status === 'PENDING' && new Date(a.deadline) <= twentyFourHoursFromNow
    ) || [];

    // Group by reviewer to count at-risk reviewers
    const atRiskReviewers = new Set(atRiskAssignments.map(a => a.reviewer_user_id));
    const atRiskCount = atRiskReviewers.size;

    const completionRate = totalAssignments > 0 
        ? Math.round((completedReviews / totalAssignments) * 100) 
        : 0;

    // Fetch reviewer activity
    const reviewerStats = new Map<string, {
        userId: string;
        displayId: string;
        totalAssigned: number;
        completed: number;
        pending: number;
        expired: number;
        completionRate: number;
        atRisk: boolean;
    }>();

    if (assignments) {
        for (const assignment of assignments) {
            const userId = assignment.reviewer_user_id;
            if (!reviewerStats.has(userId)) {
                reviewerStats.set(userId, {
                    userId,
                    displayId: userId.substring(0, 8),
                    totalAssigned: 0,
                    completed: 0,
                    pending: 0,
                    expired: 0,
                    completionRate: 0,
                    atRisk: false
                });
            }

            const stats = reviewerStats.get(userId)!;
            stats.totalAssigned++;

            if (assignment.status === 'DONE') {
                stats.completed++;
            } else if (assignment.status === 'PENDING') {
                stats.pending++;
                if (new Date(assignment.deadline) <= twentyFourHoursFromNow) {
                    stats.atRisk = true;
                }
            } else if (assignment.status === 'EXPIRED') {
                stats.expired++;
            }

            stats.completionRate = stats.totalAssigned > 0
                ? Math.round((stats.completed / stats.totalAssigned) * 100)
                : 0;
        }
    }

    const reviewers = Array.from(reviewerStats.values())
        .sort((a, b) => b.pending - a.pending); // Sort by pending count descending

    // Fetch submission review counts
    const submissionStats = new Map<string, {
        submissionId: string;
        submissionCode: string;
        totalReviews: number;
        completedReviews: number;
        pendingReviews: number;
    }>();

    if (assignments) {
        for (const assignment of assignments) {
            const submissionId = assignment.submission_id;
            if (!submissionStats.has(submissionId)) {
                submissionStats.set(submissionId, {
                    submissionId,
                    submissionCode: submissionId.substring(0, 8),
                    totalReviews: 0,
                    completedReviews: 0,
                    pendingReviews: 0
                });
            }

            const stats = submissionStats.get(submissionId)!;
            stats.totalReviews++;

            if (assignment.status === 'DONE') {
                stats.completedReviews++;
            } else if (assignment.status === 'PENDING') {
                stats.pendingReviews++;
            }
        }
    }

    // Get submission codes
    const submissionIds = Array.from(submissionStats.keys());
    if (submissionIds.length > 0) {
        const { data: submissions } = await supabase
            .from('submissions')
            .select('id, submission_code')
            .in('id', submissionIds);

        if (submissions) {
            for (const submission of submissions) {
                const stats = submissionStats.get(submission.id);
                if (stats) {
                    stats.submissionCode = submission.submission_code;
                }
            }
        }
    }

    const submissions = Array.from(submissionStats.values())
        .sort((a, b) => a.completedReviews - b.completedReviews); // Sort by completed reviews ascending

    // Determine if phase can be ended (all reviews complete or deadline passed)
    const canEndPhase = contest?.phase === 'PEER_REVIEW' && totalAssignments > 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F9F9F7] via-[#FFFFFF] to-[#F5F3F0] p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="space-y-4">
                    <h1 className="text-4xl font-serif font-bold text-[#222]">
                        Peer Review Management
                    </h1>
                    <p className="text-lg text-[#666]">
                        Monitor progress and manage the peer review phase
                        {contest && <span className="ml-2 text-[#C19A43]">• {contest.title}</span>}
                    </p>
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-2 rounded-full bg-[#C19A43]" />
                        <div className="w-16 h-[2px] bg-gradient-to-r from-[#C19A43] to-[#004D40] rounded-full" />
                        <div className="w-2 h-2 rounded-full bg-[#004D40]" />
                    </div>
                </div>

                {!activeContestId && (
                    <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6">
                        <p className="text-yellow-800">
                            No contest in PEER_REVIEW phase found. Please select a contest or change the contest phase to PEER_REVIEW.
                        </p>
                    </div>
                )}

                {/* Statistics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white/90 backdrop-blur-md border-2 border-[#E5E5E0]/50 rounded-2xl p-6 shadow-lg">
                        <div className="text-sm text-[#666] font-medium mb-2">Total Assignments</div>
                        <div className="text-4xl font-bold text-[#222]">{totalAssignments}</div>
                    </div>

                    <div className="bg-white/90 backdrop-blur-md border-2 border-[#E5E5E0]/50 rounded-2xl p-6 shadow-lg">
                        <div className="text-sm text-[#666] font-medium mb-2">Completed Reviews</div>
                        <div className="text-4xl font-bold text-emerald-600">{completedReviews}</div>
                        <div className="text-sm text-[#666] mt-2">{completionRate}% completion rate</div>
                    </div>

                    <div className="bg-white/90 backdrop-blur-md border-2 border-[#E5E5E0]/50 rounded-2xl p-6 shadow-lg">
                        <div className="text-sm text-[#666] font-medium mb-2">Pending Reviews</div>
                        <div className="text-4xl font-bold text-blue-600">{pendingReviews}</div>
                    </div>

                    <div className="bg-white/90 backdrop-blur-md border-2 border-[#E5E5E0]/50 rounded-2xl p-6 shadow-lg">
                        <div className="text-sm text-[#666] font-medium mb-2">At-Risk Reviewers</div>
                        <div className="text-4xl font-bold text-orange-600">{atRiskCount}</div>
                        <div className="text-sm text-[#666] mt-2">Deadline within 24h</div>
                    </div>
                </div>

                {/* Reviewer Activity Table */}
                <div className="bg-white/90 backdrop-blur-md border-2 border-[#E5E5E0]/50 rounded-2xl p-8 shadow-lg">
                    <h2 className="text-2xl font-serif font-bold text-[#222] mb-6">
                        Reviewer Activity
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b-2 border-[#E5E5E0]">
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#666]">Reviewer ID</th>
                                    <th className="text-center py-3 px-4 text-sm font-semibold text-[#666]">Total Assigned</th>
                                    <th className="text-center py-3 px-4 text-sm font-semibold text-[#666]">Completed</th>
                                    <th className="text-center py-3 px-4 text-sm font-semibold text-[#666]">Pending</th>
                                    <th className="text-center py-3 px-4 text-sm font-semibold text-[#666]">Expired</th>
                                    <th className="text-center py-3 px-4 text-sm font-semibold text-[#666]">Completion Rate</th>
                                    <th className="text-center py-3 px-4 text-sm font-semibold text-[#666]">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reviewers.slice(0, 20).map((reviewer) => (
                                    <tr key={reviewer.userId} className="border-b border-[#E5E5E0]/50 hover:bg-[#F9F9F7] transition-colors">
                                        <td className="py-3 px-4 font-mono text-sm text-[#222]">{reviewer.displayId}</td>
                                        <td className="py-3 px-4 text-center text-[#222]">{reviewer.totalAssigned}</td>
                                        <td className="py-3 px-4 text-center text-emerald-600 font-semibold">{reviewer.completed}</td>
                                        <td className="py-3 px-4 text-center text-blue-600 font-semibold">{reviewer.pending}</td>
                                        <td className="py-3 px-4 text-center text-orange-600 font-semibold">{reviewer.expired}</td>
                                        <td className="py-3 px-4 text-center text-[#222] font-semibold">{reviewer.completionRate}%</td>
                                        <td className="py-3 px-4 text-center">
                                            {reviewer.atRisk ? (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                                                    At Risk
                                                </span>
                                            ) : reviewer.completionRate === 100 ? (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                                                    Complete
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                                                    In Progress
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {reviewers.length > 20 && (
                        <div className="mt-4 text-center text-sm text-[#666]">
                            Showing top 20 of {reviewers.length} reviewers
                        </div>
                    )}
                </div>

                {/* Submission Review Table */}
                <div className="bg-white/90 backdrop-blur-md border-2 border-[#E5E5E0]/50 rounded-2xl p-8 shadow-lg">
                    <h2 className="text-2xl font-serif font-bold text-[#222] mb-6">
                        Submission Review Status
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b-2 border-[#E5E5E0]">
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#666]">Submission Code</th>
                                    <th className="text-center py-3 px-4 text-sm font-semibold text-[#666]">Total Reviews</th>
                                    <th className="text-center py-3 px-4 text-sm font-semibold text-[#666]">Completed</th>
                                    <th className="text-center py-3 px-4 text-sm font-semibold text-[#666]">Pending</th>
                                    <th className="text-center py-3 px-4 text-sm font-semibold text-[#666]">Progress</th>
                                </tr>
                            </thead>
                            <tbody>
                                {submissions.slice(0, 20).map((submission) => {
                                    const progress = submission.totalReviews > 0
                                        ? Math.round((submission.completedReviews / submission.totalReviews) * 100)
                                        : 0;

                                    return (
                                        <tr key={submission.submissionId} className="border-b border-[#E5E5E0]/50 hover:bg-[#F9F9F7] transition-colors">
                                            <td className="py-3 px-4 font-mono text-sm text-[#222]">{submission.submissionCode}</td>
                                            <td className="py-3 px-4 text-center text-[#222]">{submission.totalReviews}</td>
                                            <td className="py-3 px-4 text-center text-emerald-600 font-semibold">{submission.completedReviews}</td>
                                            <td className="py-3 px-4 text-center text-blue-600 font-semibold">{submission.pendingReviews}</td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 h-2 bg-[#E5E5E0] rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-[#C19A43] to-[#B8914A] rounded-full transition-all duration-300"
                                                            style={{ width: `${progress}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-sm font-semibold text-[#222] w-12 text-right">{progress}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {submissions.length > 20 && (
                        <div className="mt-4 text-center text-sm text-[#666]">
                            Showing top 20 of {submissions.length} submissions
                        </div>
                    )}
                </div>

                {/* Configuration Panel */}
                {activeContestId && (
                    <PeerReviewConfig
                        contestId={activeContestId}
                        initialDeadlineDays={votingRules.peer_review_deadline_days || 7}
                        initialFinalistCount={votingRules.peer_review_finalist_count || 100}
                        initialResultsVisible={votingRules.peer_review_results_visible || false}
                    />
                )}

                {/* Phase End Button */}
                {activeContestId && canEndPhase && (
                    <div className="bg-white/90 backdrop-blur-md border-2 border-[#E5E5E0]/50 rounded-2xl p-8 shadow-lg">
                        <h2 className="text-2xl font-serif font-bold text-[#222] mb-4">
                            End Phase & Select Finalists
                        </h2>
                        <p className="text-sm text-[#666] mb-6">
                            This will finalize all peer scores, disqualify reviewers who didn't complete their obligations,
                            select the top {votingRules.peer_review_finalist_count || 100} submissions as finalists,
                            and transition the contest to PUBLIC_VOTING phase.
                        </p>
                        <PhaseEndButton
                            contestId={activeContestId}
                            canEndPhase={canEndPhase}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
