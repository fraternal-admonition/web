"use client";

import { Contest } from "@/types/contests";
import PhaseStatus from "@/components/contests/PhaseStatus";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface PhaseStatusWrapperProps {
  contest: Contest;
  phaseStatus: {
    inSync: boolean;
    message: string;
    suggestedPhase: string;
  };
}

export default function PhaseStatusWrapper({
  contest,
  phaseStatus,
}: PhaseStatusWrapperProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleUpdatePhase = async (newPhase: string) => {
    try {
      setError(null);

      const response = await fetch(`/api/admin/contests/${contest.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phase: newPhase,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update phase");
      }

      // Refresh the page to show updated phase
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update phase");
    }
  };

  return (
    <>
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      <PhaseStatus
        contest={contest}
        suggestedPhase={phaseStatus.suggestedPhase}
        inSync={phaseStatus.inSync}
        onUpdatePhase={handleUpdatePhase}
      />
    </>
  );
}
