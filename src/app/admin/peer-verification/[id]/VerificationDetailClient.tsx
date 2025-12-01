"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow, format } from "date-fns";
import Link from "next/link";

interface Assignment {
  id: string;
  status: "PENDING" | "DONE" | "EXPIRED";
  assigned_at: string;
  deadline: string;
  completed_at: string | null;
  reviewer: {
    id: string;
    display_id: string;
    integrity_score: number;
  };
  peer_reviews: Array<{
    id: string;
    decision: "ELIMINATE" | "REINSTATE";
    comment_100: string;
    created_at: string;
  }>;
}

interface Submission {
  id: string;
  submission_code: string;
  title: string;
  body_text: string;
  status: string;
  created_at: string;
  updated_at: string;
  peer_verification_result: any;
  user: {
    id: string;
    display_id: string;
  };
  contest: {
    id: string;
    title: string;
    phase: string;
  };
  peer_assignments: Assignment[];
  ai_screenings: Array<{
    id: string;
    status: string;
    scores: any;
    notes: string;
    created_at: string;
  }>;
}

interface Props {
  submission: Submission;
}

export default function VerificationDetailClient({ submission }: Props) {
  const router = useRouter();
  const [isReassigning, setIsReassigning] = useState(false);
  const [reassignJustification, setReassignJustification] = useState("");
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(
    null
  );
  const [isOverriding, setIsOverriding] = useState(false);
  const [overrideOutcome, setOverrideOutcome] = useState<string>("");
  const [overrideJustification, setOverrideJustification] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const completedCount =
    submission.peer_assignments?.filter((a) => a.status === "DONE").length || 0;
  const expiredCount =
    submission.peer_assignments?.filter((a) => a.status === "EXPIRED").length ||
    0;
  const pendingCount =
    submission.peer_assignments?.filter((a) => a.status === "PENDING").length ||
    0;

  const handleReassign = async (assignmentId: string) => {
    if (!reassignJustification || reassignJustification.trim().length < 10) {
      setError("Justification must be at least 10 characters");
      return;
    }

    setIsReassigning(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/admin/peer-verification/reassign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignment_id: assignmentId,
          justification: reassignJustification,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reassign");
      }

      setSuccess(
        `Assignment successfully reassigned to ${data.new_reviewer.display_id}`
      );
      setSelectedAssignment(null);
      setReassignJustification("");

      // Refresh the page
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to reassign assignment");
    } finally {
      setIsReassigning(false);
    }
  };

  const handleOverride = async () => {
    if (!overrideOutcome) {
      setError("Please select an outcome");
      return;
    }

    if (
      !overrideJustification ||
      overrideJustification.trim().length < 20
    ) {
      setError("Justification must be at least 20 characters");
      return;
    }

    setIsOverriding(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/admin/peer-verification/override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submission_id: submission.id,
          outcome: overrideOutcome,
          justification: overrideJustification,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to override");
      }

      setSuccess("Verification result successfully overridden");
      setOverrideOutcome("");
      setOverrideJustification("");

      // Refresh the page
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to override result");
    } finally {
      setIsOverriding(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/peer-verification"
            className="text-[#004D40] hover:text-[#00695C] mb-4 inline-block"
          >
            ← Back to Monitoring
          </Link>
          <h1 className="text-3xl font-serif text-[#222] mb-2">
            Verification Request{" "}
            <span className="text-[#C19A43]">{submission.submission_code}</span>
          </h1>
          <p className="text-[#666]">{submission.title}</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-[#E5E5E0] p-6">
            <h3 className="text-sm font-medium text-[#666] mb-2">Completed</h3>
            <p className="text-3xl font-bold text-[#004D40]">
              {completedCount}/10
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-[#E5E5E0] p-6">
            <h3 className="text-sm font-medium text-[#666] mb-2">Pending</h3>
            <p className="text-3xl font-bold text-yellow-600">
              {pendingCount}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-[#E5E5E0] p-6">
            <h3 className="text-sm font-medium text-[#666] mb-2">Expired</h3>
            <p className="text-3xl font-bold text-red-600">{expiredCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-[#E5E5E0] p-6">
            <h3 className="text-sm font-medium text-[#666] mb-2">
              Time Since Payment
            </h3>
            <p className="text-sm font-medium text-[#222]">
              {formatDistanceToNow(new Date(submission.created_at), {
                addSuffix: true,
              })}
            </p>
          </div>
        </div>

        {/* Submission Details */}
        <div className="bg-white rounded-lg shadow-sm border border-[#E5E5E0] p-6 mb-8">
          <h2 className="text-xl font-serif text-[#222] mb-4">
            Submission <span className="text-[#C19A43]">Details</span>
          </h2>
          <div className="space-y-4">
            <div>
              <span className="text-sm font-medium text-[#666]">Author:</span>
              <span className="ml-2 text-[#222]">
                {submission.user.display_id}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium text-[#666]">Contest:</span>
              <span className="ml-2 text-[#222]">
                {submission.contest.title} ({submission.contest.phase})
              </span>
            </div>
            <div>
              <span className="text-sm font-medium text-[#666]">Status:</span>
              <span className="ml-2 text-[#222]">{submission.status}</span>
            </div>
            {submission.ai_screenings?.[0] && (
              <div>
                <span className="text-sm font-medium text-[#666]">
                  AI Decision:
                </span>
                <span className="ml-2 text-[#222]">
                  {submission.ai_screenings[0].status}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Assignments Table */}
        <div className="bg-white rounded-lg shadow-sm border border-[#E5E5E0] mb-8 overflow-hidden">
          <div className="p-6 border-b border-[#E5E5E0]">
            <h2 className="text-xl font-serif text-[#222]">
              Reviewer <span className="text-[#C19A43]">Assignments</span>
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#E5E5E0]">
              <thead className="bg-[#F9F9F7]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#666] uppercase">
                    Reviewer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#666] uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#666] uppercase">
                    Deadline
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#666] uppercase">
                    Decision
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#666] uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#E5E5E0]">
                {submission.peer_assignments.map((assignment) => (
                  <tr key={assignment.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-[#222]">
                        {assignment.reviewer.display_id}
                      </div>
                      <div className="text-xs text-[#666]">
                        Integrity: {assignment.reviewer.integrity_score}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          assignment.status === "DONE"
                            ? "bg-green-100 text-green-800"
                            : assignment.status === "EXPIRED"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {assignment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#666]">
                      {format(new Date(assignment.deadline), "MMM d, yyyy")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {assignment.peer_reviews?.[0] ? (
                        <div>
                          <span
                            className={`text-sm font-medium ${
                              assignment.peer_reviews[0].decision ===
                              "REINSTATE"
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {assignment.peer_reviews[0].decision}
                          </span>
                          <div className="text-xs text-[#666] mt-1">
                            {assignment.peer_reviews[0].comment_100}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-[#666]">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(assignment.status === "EXPIRED" ||
                        assignment.status === "PENDING") && (
                        <button
                          onClick={() => setSelectedAssignment(assignment.id)}
                          className="text-[#004D40] hover:text-[#00695C] text-sm font-medium"
                        >
                          Reassign
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Reassignment Modal */}
        {selectedAssignment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-serif text-[#222] mb-4">
                Reassign Assignment
              </h3>
              <p className="text-sm text-[#666] mb-4">
                This will mark the current assignment as expired and create a
                new assignment with a fresh 7-day deadline.
              </p>
              <textarea
                value={reassignJustification}
                onChange={(e) => setReassignJustification(e.target.value)}
                placeholder="Justification (minimum 10 characters)"
                className="w-full border border-[#E5E5E0] rounded-lg p-3 text-sm mb-4"
                rows={4}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => handleReassign(selectedAssignment)}
                  disabled={isReassigning}
                  className="flex-1 bg-[#004D40] text-white rounded-lg py-2 hover:bg-[#00695C] disabled:opacity-50"
                >
                  {isReassigning ? "Reassigning..." : "Confirm Reassignment"}
                </button>
                <button
                  onClick={() => {
                    setSelectedAssignment(null);
                    setReassignJustification("");
                  }}
                  className="flex-1 border border-[#E5E5E0] rounded-lg py-2 hover:bg-[#F9F9F7]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Override Section */}
        <div className="bg-white rounded-lg shadow-sm border border-[#E5E5E0] p-6">
          <h2 className="text-xl font-serif text-[#222] mb-4">
            Admin <span className="text-[#C19A43]">Override</span>
          </h2>
          <p className="text-sm text-[#666] mb-4">
            Manually override the verification result. This action will be
            logged and the author will be notified.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#666] mb-2">
                Outcome
              </label>
              <select
                value={overrideOutcome}
                onChange={(e) => setOverrideOutcome(e.target.value)}
                className="w-full border border-[#E5E5E0] rounded-lg p-3 text-sm"
              >
                <option value="">Select outcome...</option>
                <option value="REINSTATED">Reinstate Submission</option>
                <option value="ELIMINATED">Confirm Elimination</option>
                <option value="AI_DECISION_UPHELD">Uphold AI Decision</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#666] mb-2">
                Justification (minimum 20 characters)
              </label>
              <textarea
                value={overrideJustification}
                onChange={(e) => setOverrideJustification(e.target.value)}
                placeholder="Provide a detailed justification for this override..."
                className="w-full border border-[#E5E5E0] rounded-lg p-3 text-sm"
                rows={4}
              />
            </div>

            <button
              onClick={handleOverride}
              disabled={isOverriding}
              className="bg-red-600 text-white rounded-lg px-6 py-2 hover:bg-red-700 disabled:opacity-50"
            >
              {isOverriding ? "Overriding..." : "Override Result"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
