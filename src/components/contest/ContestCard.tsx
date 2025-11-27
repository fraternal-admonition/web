"use client";

import { Contest } from "@/types/contests";
import { getSubmissionPhaseStatus, formatDeadline } from "@/lib/contests/phase-utils";
import Link from "next/link";
import { motion } from "framer-motion";

interface ContestCardProps {
  contest: Contest;
}

const phaseColors: Record<string, { bg: string; text: string; border: string }> = {
  SUBMISSIONS_OPEN: {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
  },
  SUBMISSIONS_CLOSED: {
    bg: "bg-gray-50",
    text: "text-gray-700",
    border: "border-gray-200",
  },
  AI_FILTERING: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  PEER_REVIEW: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
  },
  PUBLIC_VOTING: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
  },
  FINALIZED: {
    bg: "bg-teal-50",
    text: "text-teal-700",
    border: "border-teal-200",
  },
};

export default function ContestCard({ contest }: ContestCardProps) {
  const phaseStatus = getSubmissionPhaseStatus(contest);
  
  // Override display phase if deadline has passed but phase is still SUBMISSIONS_OPEN
  const now = new Date();
  const submissionsCloseAt = contest.submissions_close_at ? new Date(contest.submissions_close_at) : null;
  const deadlinePassed = submissionsCloseAt ? now >= submissionsCloseAt : false;
  
  const displayPhase = 
    contest.phase === 'SUBMISSIONS_OPEN' && deadlinePassed 
      ? 'SUBMISSIONS_CLOSED' 
      : contest.phase;
  
  const phaseColor = phaseColors[displayPhase] || phaseColors.SUBMISSIONS_CLOSED;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-br from-white to-[#F9F9F7] border border-[#E5E5E0] rounded-xl shadow-lg overflow-hidden"
    >
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-[#004D40] to-[#00695C] p-8 text-white">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-serif mb-2">
              {contest.title}
            </h1>
            <p className="text-white/90 text-sm md:text-base">
              A writing contest for moral clarity and courage
            </p>
          </div>
          <div
            className={`px-4 py-2 rounded-lg border ${phaseColor.border} ${phaseColor.bg} ${phaseColor.text} font-medium text-sm whitespace-nowrap`}
          >
            {displayPhase.replace(/_/g, " ")}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {/* Deadline Section - Only show if submissions are actually open */}
        {phaseStatus.deadline && phaseStatus.canSubmit && !deadlinePassed && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-900">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="font-semibold">Submission Deadline:</span>
              <span>{formatDeadline(phaseStatus.deadline)}</span>
            </div>
          </div>
        )}

        {/* Description */}
        <div className="prose prose-lg max-w-none mb-8">
          <p className="text-[#666] leading-relaxed">
            Submit your letter addressing the moral challenges of our time.
            Choose from 50 carefully selected illustrations to accompany your
            words. Each submission requires a $7 entry fee and will be reviewed
            through our multi-phase evaluation process.
          </p>
        </div>

        {/* Status Message */}
        <div className="mb-6">
          <p className="text-lg text-[#222] font-medium">
            {deadlinePassed && contest.phase === 'SUBMISSIONS_OPEN' 
              ? 'Submission deadline has passed' 
              : phaseStatus.message}
          </p>
        </div>

        {/* Call to Action */}
        {phaseStatus.canSubmit ? (
          <Link
            href="/contest/submit"
            className="inline-block bg-[#004D40] hover:bg-[#003830] text-white px-8 py-4 rounded-lg text-lg font-sans uppercase tracking-wider transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
          >
            Submit Your Letter
          </Link>
        ) : (
          <div className="inline-block bg-gray-100 text-gray-500 px-8 py-4 rounded-lg text-lg font-sans uppercase tracking-wider cursor-not-allowed">
            Submissions Closed
          </div>
        )}

        {/* Contest Details */}
        <div className="mt-8 pt-8 border-t border-[#E5E5E0]">
          <h3 className="text-lg font-serif text-[#222] mb-4">
            Contest Details
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-[#666]">Entry Fee:</span>
              <span className="ml-2 font-medium text-[#222]">$7 USD</span>
            </div>
            <div>
              <span className="text-[#666]">Current Phase:</span>
              <span className="ml-2 font-medium text-[#222]">
                {displayPhase.replace(/_/g, " ")}
              </span>
            </div>
            {contest.max_entries && (
              <div>
                <span className="text-[#666]">Max Entries:</span>
                <span className="ml-2 font-medium text-[#222]">
                  {contest.max_entries}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
