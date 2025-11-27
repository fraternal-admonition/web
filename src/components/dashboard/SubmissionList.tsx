"use client";

import { useState } from "react";
import Link from "next/link";

interface SubmissionListProps {
  submissions: Array<{
    id: string;
    submission_code: string;
    title: string;
    status: string;
    submitted_at: string | null;
    contest?: {
      id: string;
      title: string;
    };
  }>;
}

// Status configuration with colors and labels
const statusConfig: Record<string, { label: string; color: string; icon: string; description: string }> = {
  SUBMITTED: {
    label: "Submitted",
    color: "text-green-700 bg-green-50",
    icon: "✓",
    description: "Successfully submitted and in review"
  },
  PEER_VERIFICATION_PENDING: {
    label: "Peer Verification Pending",
    color: "text-blue-700 bg-blue-50",
    icon: "⏳",
    description: "Awaiting peer verification process"
  },
  PROCESSING: {
    label: "Processing",
    color: "text-yellow-700 bg-yellow-50",
    icon: "⚙️",
    description: "AI screening in progress"
  },
  ELIMINATED: {
    label: "Eliminated",
    color: "text-red-700 bg-red-50",
    icon: "✗",
    description: "Did not pass screening"
  },
  DISQUALIFIED: {
    label: "Disqualified",
    color: "text-red-700 bg-red-50",
    icon: "⚠",
    description: "Disqualified by admin"
  },
  REINSTATED: {
    label: "Reinstated",
    color: "text-green-700 bg-green-50",
    icon: "✓",
    description: "Submission reinstated after peer review"
  },
};

export default function SubmissionList({ submissions }: SubmissionListProps) {
  const [selectedSubmission, setSelectedSubmission] = useState<typeof submissions[0] | null>(null);

  if (submissions.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-[#E5E5E0] rounded-lg overflow-hidden">
      <div className="bg-gradient-to-r from-[#004D40] to-[#00695C] px-6 py-4">
        <h2 className="text-xl font-serif text-white flex items-center gap-2">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Your Submissions
        </h2>
        <p className="text-white/80 text-sm mt-1">
          {submissions.length} {submissions.length === 1 ? "entry" : "entries"} total
        </p>
      </div>

      <div className="divide-y divide-[#E5E5E0]">
        {submissions.map((submission) => (
          <div
            key={submission.id}
            className="p-6 hover:bg-[#F9F9F7] transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {/* Submission Code */}
                <div className="flex items-center gap-3 mb-2">
                  <div className="inline-flex items-center gap-2 bg-[#004D40]/10 px-3 py-1 rounded-md">
                    <svg
                      className="w-4 h-4 text-[#004D40]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                      />
                    </svg>
                    <span className="text-sm font-mono font-bold text-[#004D40]">
                      {submission.submission_code}
                    </span>
                  </div>
                  {statusConfig[submission.status] && (
                    <span
                      className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${statusConfig[submission.status].color}`}
                      title={statusConfig[submission.status].description}
                    >
                      <span>{statusConfig[submission.status].icon}</span>
                      {statusConfig[submission.status].label}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-[#222] mb-1">
                  {submission.title}
                </h3>

                {/* Contest & Date */}
                <div className="flex flex-wrap items-center gap-3 text-sm text-[#666]">
                  {submission.contest && (
                    <span className="flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                      {submission.contest.title}
                    </span>
                  )}
                  {submission.submitted_at && (
                    <span className="flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      Submitted {new Date(submission.submitted_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="flex-shrink-0">
                <button
                  onClick={() => setSelectedSubmission(submission)}
                  className="text-sm text-[#004D40] hover:text-[#C19A43] transition-colors font-medium"
                  title="View submission details"
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Note */}
      <div className="bg-[#F9F9F7] px-6 py-4 border-t border-[#E5E5E0]">
        <div className="space-y-2">
          <p className="text-xs text-[#666] flex items-center gap-2">
            <svg
              className="w-4 h-4 text-[#C19A43]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Your submissions are tracked anonymously using submission codes. Keep your codes safe for future reference.
          </p>
          {submissions.some(s => s.status === "ELIMINATED" || s.status === "DISQUALIFIED") && (
            <p className="text-xs text-[#666] flex items-start gap-2 pt-2 border-t border-[#E5E5E0]">
              <svg
                className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span>
                Eliminated submissions did not pass our AI screening process. You can submit new entries at any time.
              </span>
            </p>
          )}
        </div>
      </div>

      {/* Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedSubmission(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-serif font-bold text-[#222] mb-1">
                  {selectedSubmission.title}
                </h3>
                <p className="text-sm font-mono text-[#666]">
                  {selectedSubmission.submission_code}
                </p>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="text-[#666] hover:text-[#222] transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-[#F9F9F7] rounded-lg p-4">
                <p className="text-xs font-semibold text-[#666] uppercase tracking-wide mb-2">Status</p>
                {statusConfig[selectedSubmission.status] && (
                  <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium ${statusConfig[selectedSubmission.status].color}`}>
                    <span className="text-lg">{statusConfig[selectedSubmission.status].icon}</span>
                    {statusConfig[selectedSubmission.status].label}
                  </span>
                )}
              </div>

              {selectedSubmission.contest && (
                <div className="bg-[#F9F9F7] rounded-lg p-4">
                  <p className="text-xs font-semibold text-[#666] uppercase tracking-wide mb-2">Contest</p>
                  <p className="text-sm text-[#222]">{selectedSubmission.contest.title}</p>
                </div>
              )}

              {selectedSubmission.submitted_at && (
                <div className="bg-[#F9F9F7] rounded-lg p-4">
                  <p className="text-xs font-semibold text-[#666] uppercase tracking-wide mb-2">Submitted</p>
                  <p className="text-sm text-[#222]">
                    {new Date(selectedSubmission.submitted_at).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              )}

              {/* View Screening Results Button */}
              {(selectedSubmission.status === "SUBMITTED" ||
                selectedSubmission.status === "ELIMINATED" ||
                selectedSubmission.status === "PEER_VERIFICATION_PENDING" ||
                selectedSubmission.status === "REINSTATED") && (
                  <Link
                    href={`/contest/screening-results/${selectedSubmission.id}`}
                    className="block w-full bg-[#004D40] text-white text-center px-6 py-3 rounded-lg hover:bg-[#00695C] transition-colors font-semibold"
                  >
                    View Screening Results
                  </Link>
                )}

              {selectedSubmission.status === "PROCESSING" && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <p className="text-sm text-blue-900">
                    Your submission is currently being processed. Screening results will be available soon.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
