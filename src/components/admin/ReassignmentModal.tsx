"use client";

import { useState, useEffect } from "react";

interface ReassignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignmentId: string;
  submissionCode: string;
  currentReviewerId: string;
  onSuccess?: () => void;
}

export default function ReassignmentModal({
  isOpen,
  onClose,
  assignmentId,
  submissionCode,
  currentReviewerId,
  onSuccess,
}: ReassignmentModalProps) {
  const [reviewers, setReviewers] = useState<Array<{ id: string; display_id: string }>>([]);
  const [selectedReviewerId, setSelectedReviewerId] = useState("");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Fetch available reviewers
      fetchReviewers();
    }
  }, [isOpen]);

  const fetchReviewers = async () => {
    try {
      // For now, we'll need to fetch eligible reviewers from the API
      // This would ideally be a separate endpoint that returns eligible reviewers
      // For simplicity, we'll just show a text input for reviewer ID
      setReviewers([]);
    } catch (err) {
      console.error("Error fetching reviewers:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/peer-review/reassign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId,
          newReviewerId: selectedReviewerId,
          reason,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to reassign");
      }

      // Success
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      console.error("Error reassigning:", err);
      setError(err instanceof Error ? err.message : "Failed to reassign");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <h2 className="text-2xl font-serif font-bold text-[#222] mb-4">
          Reassign Review
        </h2>

        <div className="mb-4 p-4 bg-[#F9F9F7] rounded-lg">
          <p className="text-sm text-[#666]">
            <strong>Submission:</strong> {submissionCode}
          </p>
          <p className="text-sm text-[#666] mt-1">
            <strong>Current Reviewer:</strong> {currentReviewerId.substring(0, 8)}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#222] mb-2">
              New Reviewer ID
            </label>
            <input
              type="text"
              value={selectedReviewerId}
              onChange={(e) => setSelectedReviewerId(e.target.value)}
              placeholder="Enter reviewer user ID"
              className="w-full px-4 py-2 border-2 border-[#E5E5E0] rounded-lg focus:outline-none focus:border-[#004D40] transition-colors"
              required
              disabled={isLoading}
            />
            <p className="text-xs text-[#666] mt-1">
              Enter the full UUID of the new reviewer
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#222] mb-2">
              Reason for Reassignment
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this assignment is being reassigned..."
              rows={3}
              className="w-full px-4 py-2 border-2 border-[#E5E5E0] rounded-lg focus:outline-none focus:border-[#004D40] transition-colors resize-none"
              disabled={isLoading}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border-2 border-[#E5E5E0] text-[#666] rounded-lg hover:bg-[#F9F9F7] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !selectedReviewerId}
              className="flex-1 px-4 py-2 bg-[#004D40] text-white rounded-lg hover:bg-[#003830] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isLoading ? "Reassigning..." : "Reassign"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
