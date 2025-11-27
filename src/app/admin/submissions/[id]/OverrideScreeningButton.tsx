"use client";

import { useState } from "react";

interface OverrideScreeningButtonProps {
  submissionId: string;
  screeningId: string;
  currentStatus: string;
  onSuccess: () => void;
}

export default function OverrideScreeningButton({
  submissionId,
  screeningId,
  currentStatus,
  onSuccess,
}: OverrideScreeningButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [overrideAction, setOverrideAction] = useState<"PASSED" | "FAILED" | null>(null);

  const handleOverride = async (newStatus: "PASSED" | "FAILED") => {
    setOverrideAction(newStatus);
    setShowConfirm(true);
  };

  const confirmOverride = async () => {
    if (!overrideAction) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/submissions/${submissionId}/override-screening`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          screening_id: screeningId,
          new_status: overrideAction,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to override screening");
      }

      onSuccess();
      setShowConfirm(false);
    } catch (error) {
      console.error("Error overriding screening:", error);
      alert("Failed to override screening. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (currentStatus !== "REVIEW") {
    return null;
  }

  return (
    <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6">
      <h3 className="text-lg font-bold text-yellow-900 mb-2 flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        Manual Review Required
      </h3>
      <p className="text-sm text-yellow-800 mb-4">
        This submission requires manual review. You can override the AI decision.
      </p>

      {!showConfirm ? (
        <div className="flex gap-3">
          <button
            onClick={() => handleOverride("PASSED")}
            disabled={loading}
            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
          >
            Override to PASSED
          </button>
          <button
            onClick={() => handleOverride("FAILED")}
            disabled={loading}
            className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
          >
            Override to FAILED
          </button>
        </div>
      ) : (
        <div className="bg-white border border-yellow-300 rounded-lg p-4">
          <p className="text-sm text-yellow-900 mb-4">
            Are you sure you want to override this submission to <strong>{overrideAction}</strong>?
            This action will be logged in the audit trail.
          </p>
          <div className="flex gap-3">
            <button
              onClick={confirmOverride}
              disabled={loading}
              className="flex-1 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors font-medium disabled:opacity-50"
            >
              {loading ? "Processing..." : "Confirm Override"}
            </button>
            <button
              onClick={() => {
                setShowConfirm(false);
                setOverrideAction(null);
              }}
              disabled={loading}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
