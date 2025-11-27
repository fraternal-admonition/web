"use client";

import { Contest } from "@/types/contests";
import PhaseIndicator from "./PhaseIndicator";

interface PublicPhaseDisplayProps {
  contest: Contest;
}

export default function PublicPhaseDisplay({
  contest,
}: PublicPhaseDisplayProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "TBD";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getPhaseStatus = (
    startDate: string | null,
    endDate: string | null
  ): "completed" | "active" | "upcoming" => {
    const now = new Date();
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    if (end && now > end) return "completed";
    if (start && now >= start) return "active";
    return "upcoming";
  };

  const phases = [
    {
      name: "Submissions",
      start: contest.submissions_open_at,
      end: contest.submissions_close_at,
      phase: "SUBMISSIONS_OPEN",
    },
    {
      name: "AI Filtering",
      start: contest.ai_filter_start_at,
      end: contest.ai_filter_end_at,
      phase: "AI_FILTERING",
    },
    {
      name: "Peer Review",
      start: contest.peer_start_at,
      end: contest.peer_end_at,
      phase: "PEER_REVIEW",
    },
    {
      name: "Public Voting",
      start: contest.public_start_at,
      end: contest.public_end_at,
      phase: "PUBLIC_VOTING",
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-[#E5E5E0] p-6">
      <div className="mb-4">
        <h3 className="text-lg font-serif text-[#222] mb-2">Current Phase</h3>
        <PhaseIndicator phase={contest.phase as any} showTooltip={true} />
      </div>

      <div className="border-t border-[#E5E5E0] pt-4">
        <h3 className="text-lg font-serif text-[#222] mb-4">
          Contest Timeline
        </h3>
        <div className="space-y-3">
          {phases.map((phase, index) => {
            const status = getPhaseStatus(phase.start, phase.end);
            const isCurrentPhase = contest.phase === phase.phase;

            return (
              <div
                key={index}
                className={`flex items-start justify-between p-3 rounded-lg ${
                  isCurrentPhase
                    ? "bg-[#004D40] bg-opacity-5 border border-[#004D40]"
                    : "bg-[#F9F9F7]"
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-sm font-medium ${
                        isCurrentPhase ? "text-[#004D40]" : "text-[#222]"
                      }`}
                    >
                      {phase.name}
                    </span>
                    {status === "completed" && (
                      <span className="text-xs text-green-600">✓</span>
                    )}
                    {isCurrentPhase && (
                      <span className="text-xs text-[#004D40] font-medium">
                        (Current)
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#666]">
                    {formatDate(phase.start)} - {formatDate(phase.end)}
                  </div>
                </div>
                <div className="ml-4">
                  {status === "completed" && (
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                      Completed
                    </span>
                  )}
                  {status === "active" && (
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                      Active
                    </span>
                  )}
                  {status === "upcoming" && (
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                      Upcoming
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
