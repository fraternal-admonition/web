import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";
import DeleteContestButton from "./DeleteContestButton";
import { ContestWithStats } from "@/types/contests";
import PhaseIndicator from "@/components/contests/PhaseIndicator";
import Breadcrumb from "@/components/admin/Breadcrumb";

export default async function ContestsPage() {
  // Server-side authentication check
  await requireAdmin("/admin/contests");

  const adminSupabase = await createAdminClient();

  // Fetch all contests with submission counts
  const { data: contests, error } = await adminSupabase
    .from("contests")
    .select("*")
    .order("created_at", { ascending: false });

  // Get submission counts for each contest
  let contestsWithCounts: ContestWithStats[] = [];
  if (contests) {
    contestsWithCounts = await Promise.all(
      contests.map(async (contest) => {
        const { count } = await adminSupabase
          .from("submissions")
          .select("id", { count: "exact", head: true })
          .eq("contest_id", contest.id);

        return {
          ...contest,
          submission_count: count || 0,
        };
      })
    );
  }

  if (error) {
    console.error("Error fetching contests:", error);
  }

  return (
    <div className="min-h-screen bg-[#F9F9F7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={[{ label: "Contests" }]} />
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-serif text-[#222] mb-2">
              Contest <span className="text-[#C19A43]">Management</span>
            </h1>
            <p className="text-[#666]">
              Configure and manage Letters to Goliath contests
            </p>
          </div>
          <Link
            href="/admin/contests/new"
            className="bg-[#004D40] text-white px-6 py-3 rounded-lg hover:bg-[#00695C] transition-all shadow-md hover:shadow-lg font-medium"
          >
            + New Contest
          </Link>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            Error loading contests. Please try again.
          </div>
        )}

        {/* Contests List */}
        {!contestsWithCounts || contestsWithCounts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-[#E5E5E0] p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-[#F9F9F7] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-[#C19A43]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                  />
                </svg>
              </div>
              <p className="text-[#666] mb-4">
                No contests yet. Create your first contest to get started!
              </p>
              <Link
                href="/admin/contests/new"
                className="inline-block text-[#004D40] hover:text-[#C19A43] font-medium transition-colors"
              >
                Create Contest →
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-[#E5E5E0] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#E5E5E0]">
                <thead className="bg-[#F9F9F7]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">
                      Slug
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">
                      Phase
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">
                      Submissions
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-[#666] uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-[#E5E5E0]">
                  {contestsWithCounts.map((contest) => (
                    <tr
                      key={contest.id}
                      className="hover:bg-[#F9F9F7] transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-[#222]">
                          {contest.title}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-[#666] font-mono">
                          {contest.slug || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <PhaseIndicator
                          phase={contest.phase as any}
                          showTooltip={true}
                        />
                      </td>
                      <td className="px-6 py-4">
                        {(contest.submission_count ?? 0) > 0 ? (
                          <Link
                            href={`/admin/submissions?contest_id=${contest.id}`}
                            className="text-sm text-[#004D40] hover:text-[#C19A43] font-medium transition-colors"
                          >
                            {contest.submission_count}
                          </Link>
                        ) : (
                          <div className="text-sm text-[#666]">0</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#666]">
                        {new Date(contest.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <Link
                          href={`/admin/contests/${contest.id}`}
                          className="text-[#004D40] hover:text-[#C19A43] mr-4 transition-colors"
                        >
                          Edit
                        </Link>
                        <Link
                          href={`/admin/contests/${contest.id}/illustrations`}
                          className="text-[#004D40] hover:text-[#C19A43] mr-4 transition-colors"
                        >
                          Illustrations
                        </Link>
                        <Link
                          href={`/admin/submissions?contest_id=${contest.id}`}
                          className="text-[#004D40] hover:text-[#C19A43] mr-4 transition-colors"
                        >
                          Submissions
                        </Link>
                        <DeleteContestButton
                          contestId={contest.id}
                          contestTitle={contest.title}
                          submissionCount={contest.submission_count || 0}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
