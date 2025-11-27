"use client";

import { Contest } from "@/types/contests";
import PhaseIndicator from "./PhaseIndicator";
import { useState } from "react";

interface PhaseStatusProps {
  contest: Contest;
  suggestedPhase: string;
  inSync: boolean;
  onUpdatePhase?: (newPhase: string) => void;
}

export default function PhaseStatus({
  contest,
  suggestedPhase,
  inSync,
  onUpdatePhase,
}: PhaseStatusProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdatePhase = async () => {
    if (!onUpdatePhase) return;

    setIsUpdating(true);
    try {
      await onUpdatePhase(suggestedPhase);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div
      className={`rounded-lg border p-4 mb-6 ${
        inSync
          ? "bg-green-50 border-green-200"
          : "bg-orange-50 border-orange-200"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm font-medium text-[#666]">
              Current Phase:
            </span>
            <PhaseIndicator phase={contest.phase as any} />
          </div>

          {!inSync && (
            <>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-sm font-medium text-[#666]">
                  Suggested Phase:
                </span>
                <PhaseIndicator phase={suggestedPhase as any} />
              </div>
              <p className="text-sm text-orange-700 mb-3">
                ⚠️ Timeline suggests the phase should be updated based on
                configured dates
              </p>
            </>
          )}

          {inSync && (
            <p className="text-sm text-green-700">
              ✓ Contest phase is in sync with timeline
            </p>
          )}
        </div>

        {!inSync && onUpdatePhase && (
          <button
            onClick={handleUpdatePhase}
            disabled={isUpdating}
            className="ml-4 px-4 py-2 bg-[#004D40] text-white text-sm font-medium rounded-lg hover:bg-[#00695C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdating ? "Updating..." : "Update to Suggested"}
          </button>
        )}
      </div>
    </div>
  );
}
