"use client";

interface Assignment {
  id: string;
  status: "PENDING" | "DONE" | "EXPIRED";
  completed_at: string | null;
}

interface Reviewer {
  id: string;
  display_id: string;
  integrity_score: number;
  qualified_evaluator: boolean;
  peer_assignments?: Assignment[];
}

interface Props {
  reviewers: Reviewer[];
}

export default function ReviewerActivity({ reviewers }: Props) {
  if (reviewers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-[#E5E5E0] p-8 text-center">
        <p className="text-[#666]">No reviewer activity data available</p>
      </div>
    );
  }

  // Calculate metrics for each reviewer
  const reviewersWithMetrics = reviewers.map((reviewer) => {
    const assignments = reviewer.peer_assignments || [];
    const totalAssignments = assignments.length;
    const completedAssignments = assignments.filter(
      (a) => a.status === "DONE"
    ).length;
    const expiredAssignments = assignments.filter(
      (a) => a.status === "EXPIRED"
    ).length;
    const completionRate =
      totalAssignments > 0
        ? Math.round((completedAssignments / totalAssignments) * 100)
        : 0;

    return {
      ...reviewer,
      totalAssignments,
      completedAssignments,
      expiredAssignments,
      completionRate,
    };
  });

  // Sort by integrity score descending
  const sortedReviewers = reviewersWithMetrics.sort(
    (a, b) => (b.integrity_score || 0) - (a.integrity_score || 0)
  );

  // Identify flagged reviewers (negative integrity score)
  const flaggedReviewers = sortedReviewers.filter(
    (r) => (r.integrity_score || 0) < 0
  );

  return (
    <div className="space-y-6">
      {/* Flagged Reviewers Alert */}
      {flaggedReviewers.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-red-800 mb-2">
            ⚠️ {flaggedReviewers.length} Reviewer
            {flaggedReviewers.length > 1 ? "s" : ""} Flagged
          </h3>
          <p className="text-sm text-red-700">
            The following reviewers have negative integrity scores and may
            require review:
          </p>
          <ul className="mt-2 space-y-1">
            {flaggedReviewers.map((reviewer) => (
              <li key={reviewer.id} className="text-sm text-red-700">
                {reviewer.display_id} (Score: {reviewer.integrity_score})
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Reviewer Table */}
      <div className="bg-white rounded-lg shadow-sm border border-[#E5E5E0] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#E5E5E0]">
            <thead className="bg-[#F9F9F7]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#666] uppercase tracking-wider">
                  Reviewer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#666] uppercase tracking-wider">
                  Integrity Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#666] uppercase tracking-wider">
                  Assignments
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#666] uppercase tracking-wider">
                  Completion Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#666] uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#E5E5E0]">
              {sortedReviewers.slice(0, 50).map((reviewer) => {
                const isNegative = (reviewer.integrity_score || 0) < 0;
                const isQualified = reviewer.qualified_evaluator === true;

                return (
                  <tr
                    key={reviewer.id}
                    className={`hover:bg-[#F9F9F7] ${
                      isNegative ? "bg-red-50" : ""
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-[#222]">
                        {reviewer.display_id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`text-sm font-medium ${
                          isNegative
                            ? "text-red-600"
                            : (reviewer.integrity_score || 0) > 50
                            ? "text-green-600"
                            : "text-[#666]"
                        }`}
                      >
                        {reviewer.integrity_score || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-[#666]">
                        {reviewer.completedAssignments}/{reviewer.totalAssignments}
                        {reviewer.expiredAssignments > 0 && (
                          <span className="text-red-600 ml-2">
                            ({reviewer.expiredAssignments} expired)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-[#E5E5E0] rounded-full h-2 mr-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              reviewer.completionRate >= 80
                                ? "bg-green-500"
                                : reviewer.completionRate >= 50
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${reviewer.completionRate}%` }}
                          />
                        </div>
                        <span className="text-sm text-[#666]">
                          {reviewer.completionRate}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isQualified && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#004D40] text-white">
                          Qualified
                        </span>
                      )}
                      {isNegative && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 ml-2">
                          Flagged
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
