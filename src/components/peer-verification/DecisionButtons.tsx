'use client';

import { XCircle, CheckCircle } from 'lucide-react';

interface DecisionButtonsProps {
  decision: 'ELIMINATE' | 'REINSTATE' | null;
  onDecisionChange: (decision: 'ELIMINATE' | 'REINSTATE') => void;
  disabled?: boolean;
}

export default function DecisionButtons({ 
  decision, 
  onDecisionChange,
  disabled = false 
}: DecisionButtonsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Eliminate Button */}
      <button
        type="button"
        onClick={() => onDecisionChange('ELIMINATE')}
        disabled={disabled}
        className={`p-6 rounded-lg border-2 transition-all duration-200 ${
          decision === 'ELIMINATE'
            ? 'border-[#C62828] bg-[#C62828]/5 shadow-md'
            : 'border-[#E5E5E0] hover:border-[#C62828]/50 hover:bg-[#C62828]/5'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div className="flex flex-col items-center gap-3">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
            decision === 'ELIMINATE' ? 'bg-[#C62828]' : 'bg-[#E5E5E0]'
          }`}>
            <XCircle className={`w-8 h-8 ${
              decision === 'ELIMINATE' ? 'text-white' : 'text-[#666]'
            }`} />
          </div>
          <div className="text-center">
            <h3 className={`text-lg font-semibold mb-1 ${
              decision === 'ELIMINATE' ? 'text-[#C62828]' : 'text-[#666]'
            }`}>
              Eliminate
            </h3>
            <p className="text-sm text-[#666]">
              This submission should be eliminated from the contest
            </p>
          </div>
        </div>
      </button>

      {/* Reinstate Button */}
      <button
        type="button"
        onClick={() => onDecisionChange('REINSTATE')}
        disabled={disabled}
        className={`p-6 rounded-lg border-2 transition-all duration-200 ${
          decision === 'REINSTATE'
            ? 'border-[#2E7D32] bg-[#2E7D32]/5 shadow-md'
            : 'border-[#E5E5E0] hover:border-[#2E7D32]/50 hover:bg-[#2E7D32]/5'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div className="flex flex-col items-center gap-3">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
            decision === 'REINSTATE' ? 'bg-[#2E7D32]' : 'bg-[#E5E5E0]'
          }`}>
            <CheckCircle className={`w-8 h-8 ${
              decision === 'REINSTATE' ? 'text-white' : 'text-[#666]'
            }`} />
          </div>
          <div className="text-center">
            <h3 className={`text-lg font-semibold mb-1 ${
              decision === 'REINSTATE' ? 'text-[#2E7D32]' : 'text-[#666]'
            }`}>
              Reinstate
            </h3>
            <p className="text-sm text-[#666]">
              This submission should be reinstated into the contest
            </p>
          </div>
        </div>
      </button>
    </div>
  );
}
