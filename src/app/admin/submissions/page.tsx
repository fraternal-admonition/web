"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Breadcrumb from "@/components/admin/Breadcrumb";

interface Submission {
  id: string;
  submission_code: string;
  title: string;
  status: string;
  created_at: string;
  submitted_at: string | null;
  user: {
    email: string;
  };
  contest: {
    id: string;
    title: string;
  };
  ai_screenings?: Array<{
    id: string;
    status: string;
    phase: string;
    created_at: string;
  }>;
  flags?: Array<{
    id: string;
    reason: string;
    created_at: string;
  }>;
}

interface SubmissionsResponse {
  submissions: Submission[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [contestFilter, setContestFilter] = useState("");
  const [contestTitle, setContestTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Get contest_id from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const contestId = params.get("contest_id");
    if (contestId) {
      setContestFilter(contestId);
      // Fetch contest title
      fetch(`/api/admin/contests/${contestId}`)
        .then(res => res.json())
        .then(data => {
          if (data.contest) {
            setContestTitle(data.contest.title);
          }
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    fetchSubmissions();
  }, [page, statusFilter, contestFilter, searchQuery]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
      });

      if (statusFilter) params.append("status", statusFilter);
      if (contestFilter) params.append("contest_id", contestFilter);
      if (searchQuery) params.append("search", searchQuery);

      console.log("Fetching submissions with params:", {
        statusFilter,
        contestFilter,
        searchQuery,
        page,
      });
      console.log("URL:", `/api/admin/submissions?${params}`);

      const response = await fetch(`/api/admin/submissions?${params}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch submissions");
      }

      const data: SubmissionsResponse = await response.json();
      console.log("Received data:", {
        submissionsCount: data.submissions?.length || 0,
        total: data.total,
        totalPages: data.totalPages,
      });
      setSubmissions(data.submissions);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setPage(1);
  };

  const handleExportCSV = () => {
    // Create CSV content
    const headers = ["Code", "Status", "Email", "Title", "Contest", "Created", "Submitted"];
    const rows = submissions.map(s => [
      s.submission_code,
      s.status,
      s.user.email,
      `"${s.title.replace(/"/g, '""')}"`, // Escape quotes
      `"${s.contest.title.replace(/"/g, '""')}"`,
      new Date(s.created_at).toLocaleDateString(),
      s.submitted_at ? new Date(s.submitted_at).toLocaleDateString() : "N/A"
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    // Download
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `submissions-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING_PAYMENT: "bg-yellow-100 text-yellow-800 border-yellow-200",
      SUBMITTED: "bg-green-100 text-green-800 border-green-200",
      PROCESSING: "bg-blue-100 text-blue-800 border-blue-200",
      ELIMINATED: "bg-red-100 text-red-800 border-red-200",
      PEER_VERIFICATION_PENDING: "bg-purple-100 text-purple-800 border-purple-200",
      DISQUALIFIED: "bg-red-100 text-red-800 border-red-200",
      FINALIST: "bg-blue-100 text-blue-800 border-blue-200",
      WINNER: "bg-purple-100 text-purple-800 border-purple-200",
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || "bg-gray-100 text-gray-800"}`}>
        {status.replace(/_/g, " ")}
      </span>
    );
  };

  const getAIScreeningBadge = (screening: Submission['ai_screenings']) => {
    if (!screening || screening.length === 0) {
      return <span className="text-xs text-gray-400">Not Screened</span>;
    }

    const latest = screening[0];
    const styles: Record<string, string> = {
      PASSED: "bg-green-100 text-green-700 border-green-200",
      FAILED: "bg-red-100 text-red-700 border-red-200",
      REVIEW: "bg-yellow-100 text-yellow-700 border-yellow-200",
    };

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${styles[latest.status] || "bg-gray-100 text-gray-700"}`}>
        AI: {latest.status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#F9F9F7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={[{ label: "Submissions" }]} />
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif text-[#222] mb-2">
            Submission <span className="text-[#C19A43]">Management</span>
          </h1>
          <p className="text-[#666]">
            {contestTitle ? `Viewing submissions for: ${contestTitle}` : "View and manage all contest submissions"}
          </p>
          {contestFilter && (
            <button
              onClick={() => {
                setContestFilter("");
                setContestTitle("");
                setPage(1);
                window.history.pushState({}, "", "/admin/submissions");
              }}
              className="mt-2 text-sm text-[#004D40] hover:text-[#C19A43] transition-colors inline-flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear contest filter
            </button>
          )}
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-[#E5E5E0] p-6 mb-6">
          <div className="grid md:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-[#666] mb-2">
                Filter by Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-4 py-2 border border-[#E5E5E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004D40] focus:border-transparent"
              >
                <option value="">All Statuses</option>
                <optgroup label="Submission Status">
                  <option value="PENDING_PAYMENT">Pending Payment</option>
                  <option value="SUBMITTED">Submitted</option>
                  <option value="PROCESSING">Processing (AI Screening)</option>
                  <option value="ELIMINATED">Eliminated</option>
                  <option value="PEER_VERIFICATION_PENDING">Peer Verification Pending</option>
                  <option value="DISQUALIFIED">Disqualified</option>
                  <option value="FINALIST">Finalist</option>
                  <option value="WINNER">Winner</option>
                </optgroup>
                <optgroup label="AI Screening Status">
                  <option value="AI_PASSED">AI: Passed</option>
                  <option value="AI_FAILED">AI: Failed</option>
                  <option value="AI_REVIEW">AI: Manual Review</option>
                </optgroup>
              </select>
            </div>

            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#666] mb-2">
                Search by Code or Title
              </label>
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Enter submission code or title..."
                  className="flex-1 px-4 py-2 border border-[#E5E5E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004D40] focus:border-transparent"
                />
                <button
                  type="submit"
                  className="bg-[#004D40] text-white px-6 py-2 rounded-lg hover:bg-[#00695C] transition-colors font-medium"
                >
                  Search
                </button>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSearchInput("");
                      setPage(1);
                    }}
                    className="px-4 py-2 border border-[#E5E5E0] rounded-lg hover:bg-[#F9F9F7] transition-colors text-[#666]"
                  >
                    Clear
                  </button>
                )}
              </form>
            </div>
          </div>

          {/* Export Button */}
          <div className="mt-4 pt-4 border-t border-[#E5E5E0] flex justify-between items-center">
            <p className="text-sm text-[#666]">
              Showing {submissions.length} of {total} submissions
            </p>
            <button
              onClick={handleExportCSV}
              disabled={submissions.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 border border-[#E5E5E0] rounded-lg hover:bg-[#F9F9F7] transition-colors text-[#666] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-[#E5E5E0] p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#004D40]"></div>
            <p className="mt-4 text-[#666]">Loading submissions...</p>
          </div>
        ) : submissions.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-lg shadow-sm border border-[#E5E5E0] p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-[#F9F9F7] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#C19A43]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-[#666] mb-4">
                {searchQuery || statusFilter ? "No submissions match your filters." : "No submissions yet."}
              </p>
            </div>
          </div>
        ) : (
          /* Submissions Table */
          <>
            <div className="bg-white rounded-lg shadow-sm border border-[#E5E5E0] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#E5E5E0]">
                  <thead className="bg-[#F9F9F7]">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">
                        Code
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">
                        AI Screening
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">
                        User Email
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">
                        Contest
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
                    {submissions.map((submission) => (
                      <tr key={submission.id} className="hover:bg-[#F9F9F7] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-mono font-medium text-[#004D40]">
                              {submission.submission_code}
                            </div>
                            {submission.flags && submission.flags.length > 0 && (
                              <span className="inline-flex items-center" title="Peer Verification Requested">
                                <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
                                </svg>
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(submission.status)}
                        </td>
                        <td className="px-6 py-4">
                          {getAIScreeningBadge(submission.ai_screenings)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-[#666]">
                            {submission.user.email}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-[#222] max-w-xs truncate">
                            {submission.title}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-[#666]">
                            {submission.contest.title}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-[#666]">
                          {new Date(submission.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium">
                          <Link
                            href={`/admin/submissions/${submission.id}`}
                            className="text-[#004D40] hover:text-[#C19A43] transition-colors"
                          >
                            View Details
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-[#E5E5E0] rounded-lg hover:bg-[#F9F9F7] transition-colors text-[#666] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-[#666]">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-[#E5E5E0] rounded-lg hover:bg-[#F9F9F7] transition-colors text-[#666] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
