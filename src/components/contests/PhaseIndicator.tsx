"use client";

type ContestPhase =
  | "SUBMISSIONS_OPEN"
  | "SUBMISSIONS_CLOSED"
  | "AI_FILTERING"
  | "PEER_REVIEW"
  | "PUBLIC_VOTING"
  | "FINALIZED";

interface PhaseIndicatorProps {
  phase: ContestPhase;
  showTooltip?: boolean;
}

const PHASE_CONFIG: Record<
  ContestPhase,
  {
    label: string;
    color: string;
    bgColor: string;
    description: string;
  }
> = {
  SUBMISSIONS_OPEN: {
    label: "Submissions Open",
    color: "text-green-700",
    bgColor: "bg-green-100",
    description: "Contest is accepting new submissions",
  },
  SUBMISSIONS_CLOSED: {
    label: "Submissions Closed",
    color: "text-gray-700",
    bgColor: "bg-gray-100",
    description: "Submission period has ended",
  },
  AI_FILTERING: {
    label: "AI Filtering",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
    description: "Submissions are being screened by AI",
  },
  PEER_REVIEW: {
    label: "Peer Review",
    color: "text-purple-700",
    bgColor: "bg-purple-100",
    description: "Submissions are being reviewed by peers",
  },
  PUBLIC_VOTING: {
    label: "Public Voting",
    color: "text-orange-700",
    bgColor: "bg-orange-100",
    description: "Public voting is open for finalists",
  },
  FINALIZED: {
    label: "Finalized",
    color: "text-teal-700",
    bgColor: "bg-teal-100",
    description: "Contest is complete and winners announced",
  },
};

export default function PhaseIndicator({
  phase,
  showTooltip = false,
}: PhaseIndicatorProps) {
  const config = PHASE_CONFIG[phase];

  if (!config) {
    return null;
  }

  return (
    <div className="relative inline-block group">
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bgColor} ${config.color}`}
      >
        {config.label}
      </span>
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
          {config.description}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
            <div className="border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}
    </div>
  );
}
