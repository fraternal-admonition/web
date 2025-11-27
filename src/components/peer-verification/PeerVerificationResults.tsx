'use client';

import { CheckCircle, XCircle, AlertCircle, Users } from 'lucide-react';

interface PeerVerificationResultsProps {
  result: {
    decision: 'REINSTATED' | 'ELIMINATED_CONFIRMED' | 'AI_DECISION_UPHELD';
    total_votes: number;
    eliminate_votes: number;
    reinstate_votes: number;
    eliminate_percentage: number;
    reinstate_percentage: number;
    completed_at: string;
    message: string;
  };
}

export default function PeerVerificationResults({ result }: PeerVerificationResultsProps) {
  const isReinstated = result.decision === 'REINSTATED';
  const isConfirmed = result.decision === 'ELIMINATED_CONFIRMED';
  const isUpheld = result.decision === 'AI_DECISION_UPHELD';

  const statusColor = isReinstated
    ? 'text-[#2E7D32]'
    : isConfirmed
    ? 'text-[#C62828]'
    : 'text-[#F57C00]';

  const statusBg = isReinstated
    ? 'bg-[#2E7D32]/5 border-[#2E7D32]'
    : isConfirmed
    ? 'bg-[#C62828]/5 border-[#C62828]'
    : 'bg-[#F57C00]/5 border-[#F57C00]';

  const StatusIcon = isReinstated
    ? CheckCircle
    : isConfirmed
    ? XCircle
    : AlertCircle;

  return (
    <div className="bg-white border border-[#E5E5E0] rounded-lg p-8 mb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-[#6A1B9A]/10 flex items-center justify-center">
          <Users className="w-6 h-6 text-[#6A1B9A]" />
        </div>
        <div>
          <h2 className="text-2xl font-serif text-[#222]">
            Peer Verification Results
          </h2>
          <p className="text-sm text-[#666]">
            Reviewed by 10 fellow contestants
          </p>
        </div>
      </div>

      {/* Decision Badge */}
      <div className={`${statusBg} border-l-4 rounded-lg p-6 mb-6`}>
        <div className="flex items-start gap-4">
          <StatusIcon className={`w-8 h-8 ${statusColor} flex-shrink-0`} />
          <div className="flex-1">
            <h3 className={`text-xl font-semibold ${statusColor} mb-2`}>
              {isReinstated && 'Submission Reinstated!'}
              {isConfirmed && 'Elimination Confirmed'}
              {isUpheld && 'AI Decision Upheld'}
            </h3>
            <p className="text-[#444] leading-relaxed">{result.message}</p>
          </div>
        </div>
      </div>

      {/* Vote Breakdown */}
      <div className="bg-[#F9F9F7] rounded-lg p-6 mb-6">
        <h4 className="text-lg font-semibold text-[#222] mb-4">
          Vote Breakdown
        </h4>

        {/* Reinstate Votes */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-[#444]">Reinstate</span>
            <span className="text-sm font-semibold text-[#2E7D32]">
              {result.reinstate_votes}/{result.total_votes} ({result.reinstate_percentage}%)
            </span>
          </div>
          <div className="w-full bg-[#E5E5E0] rounded-full h-3 overflow-hidden">
            <div
              className="bg-[#2E7D32] h-full rounded-full transition-all duration-500"
              style={{ width: `${result.reinstate_percentage}%` }}
            />
          </div>
        </div>

        {/* Eliminate Votes */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-[#444]">Eliminate</span>
            <span className="text-sm font-semibold text-[#C62828]">
              {result.eliminate_votes}/{result.total_votes} ({result.eliminate_percentage}%)
            </span>
          </div>
          <div className="w-full bg-[#E5E5E0] rounded-full h-3 overflow-hidden">
            <div
              className="bg-[#C62828] h-full rounded-full transition-all duration-500"
              style={{ width: `${result.eliminate_percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Completion Date */}
      <div className="text-sm text-[#666] text-center">
        Verification completed on{' '}
        {new Date(result.completed_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </div>
    </div>
  );
}
