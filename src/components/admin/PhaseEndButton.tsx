"use client";

import { useState } from "react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

interface PhaseEndButtonProps {
  contestId: string;
  canEndPhase: boolean;
  onSuccess?: () => void;
}

export default function PhaseEndButton({
  contestId,
  canEndPhase,
  onSuccess,
}: PhaseEndButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEndPhase = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/peer-review/end-phase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contestId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to end phase");
      }

      const result = await response.json();
      console.log("Phase end result:", result);

      // Close dialog and call success callback
      setShowConfirm(false);
      if (onSuccess) {
        onSuccess();
      }

      // Reload page to show updated data
      window.location.reload();
    } catch (err) {
      console.error("Error ending phase:", err);
      setError(err instanceof Error ? err.message : "Failed to end phase");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={!canEndPhase || isProcessing}
        className="w-full px-6 py-4 bg-gradient-to-r from-[#C19A43] to-[#B8914A] text-white rounded-xl hover:from-[#B8914A] hover:to-[#A88239] transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg shadow-lg"
      >
        {isProcessing ? "Processing..." : "End Peer Review Phase & Select Finalists"}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg">
          {error}
        </div>
      )}

      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleEndPhase}
        title="End Peer Review Phase"
        message="This will finalize all peer scores, disqualify reviewers who didn't complete their obligations, select finalists, and transition to PUBLIC_VOTING phase. This action cannot be undone. Are you sure?"
        confirmText="End Phase"
        cancelText="Cancel"
        variant="warning"
      />
    </>
  );
}
