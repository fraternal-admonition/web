import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";
import VerificationRequestList from "@/components/admin/VerificationRequestList";
import ReviewerActivity from "@/components/admin/ReviewerActivity";

export default async function AdminPeerVerificationDashboard() {
  await requireAdmin("/admin/peer-verification");
  const supabase = await createAdminClient();

  // Fetch all verification requests (pending, reinstated, or eliminated with peer verification)
  const { data: verificationRequests, error: requestsError } = await supabase
    .from("submissions")
    .select(`
      id,
      submission_code,
      title,
      status,
      created_at,
      updated_at,
      peer_verification_result,
      user_id,
      peer_assignments(
        id,
        status,
        assigned_at,
        deadline,
        completed_at
      )
    `)
    .or("status.eq.PEER_VERIFICATION_PENDING,status.eq.REINSTATED,and(status.eq.ELIMINATED,peer_verification_result.not.is.null)")
    .order("created_at", { ascending: false });

  // Fetch user display IDs separately to handle null values
  const userIds = verificationRequests?.map(r => r.user_id).filter(Boolean) || [];
  const { data: users } = await supabase
    .from("users")
    .select("id, display_id")
    .in("id", userIds);

  // Map users to requests
  const usersMap = new Map(users?.map(u => [u.id, u]) || []);
  const requestsWithUsers = verificationRequests?.map(req => {
    const user = usersMap.get(req.user_id);
    return {
      ...req,
      user: {
        display_id: user?.display_id || req.user_id?.substring(0, 8) || "Unknown"
      }
    };
  }) || [];

  // Fetch reviewer activity metrics
  const { data: reviewerMetrics, error: metricsError } = await supabase.rpc(
    "get_reviewer_activity_metrics"
  );

  // If RPC doesn't exist, fetch manually
  let reviewers = [];
  if (metricsError) {
    const { data: reviewerData } = await supabase
      .from("users")
      .select(`
        id,
        display_id,
        integrity_score,
        qualified_evaluator,
        peer_assignments(
          id,
          status,
          completed_at
        )
      `)
      .not("peer_assignments", "is", null)
      .order("integrity_score", { ascending: false })
      .limit(50);

    reviewers = reviewerData || [];
  } else {
    reviewers = reviewerMetrics || [];
  }

  // Calculate stats
  const totalVerifications = requestsWithUsers?.length || 0;
  const completedVerifications =
    requestsWithUsers?.filter(
      (req) =>
        req.peer_assignments?.filter((a: any) => a.status === "DONE").length >=
        10
    ).length || 0;
  const pendingVerifications = totalVerifications - completedVerifications;

  const totalAssignments =
    requestsWithUsers?.reduce(
      (sum, req) => sum + (req.peer_assignments?.length || 0),
      0
    ) || 0;
  const completedAssignments =
    requestsWithUsers?.reduce(
      (sum, req) =>
        sum +
        (req.peer_assignments?.filter((a: any) => a.status === "DONE").length ||
          0),
      0
    ) || 0;
  const expiredAssignments =
    requestsWithUsers?.reduce(
      (sum, req) =>
        sum +
        (req.peer_assignments?.filter((a: any) => a.status === "EXPIRED")
          .length || 0),
      0
    ) || 0;

  return (
    <div className="min-h-screen bg-[#F9F9F7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif text-[#222] mb-2">
            Peer Verification <span className="text-[#C19A43]">Monitoring</span>
          </h1>
          <p className="text-[#666]">
            Monitor verification requests, reviewer activity, and system health
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-[#E5E5E0] p-6">
            <h3 className="text-sm font-medium text-[#666] mb-2">
              Active Verifications
            </h3>
            <p className="text-3xl font-bold text-[#004D40]">
              {pendingVerifications}
            </p>
            <p className="text-xs text-[#666] mt-1">
              {completedVerifications} completed
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-[#E5E5E0] p-6">
            <h3 className="text-sm font-medium text-[#666] mb-2">
              Total Assignments
            </h3>
            <p className="text-3xl font-bold text-[#004D40]">
              {totalAssignments}
            </p>
            <p className="text-xs text-[#666] mt-1">
              {completedAssignments} completed
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-[#E5E5E0] p-6">
            <h3 className="text-sm font-medium text-[#666] mb-2">
              Completion Rate
            </h3>
            <p className="text-3xl font-bold text-[#004D40]">
              {totalAssignments > 0
                ? Math.round((completedAssignments / totalAssignments) * 100)
                : 0}
              %
            </p>
            <p className="text-xs text-[#666] mt-1">
              {expiredAssignments} expired
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-[#E5E5E0] p-6">
            <h3 className="text-sm font-medium text-[#666] mb-2">
              Active Reviewers
            </h3>
            <p className="text-3xl font-bold text-[#004D40]">
              {reviewers.length}
            </p>
            <p className="text-xs text-[#666] mt-1">
              {
                reviewers.filter((r: any) => r.qualified_evaluator === true)
                  .length
              }{" "}
              qualified
            </p>
          </div>
        </div>

        {/* Verification Requests Section */}
        <div className="mb-8">
          <h2 className="text-xl font-serif text-[#222] mb-4">
            Verification <span className="text-[#C19A43]">Requests</span>
          </h2>
          <VerificationRequestList requests={requestsWithUsers || []} />
        </div>

        {/* Reviewer Activity Section */}
        <div>
          <h2 className="text-xl font-serif text-[#222] mb-4">
            Reviewer <span className="text-[#C19A43]">Activity</span>
          </h2>
          <ReviewerActivity reviewers={reviewers} />
        </div>
      </div>
    </div>
  );
}
