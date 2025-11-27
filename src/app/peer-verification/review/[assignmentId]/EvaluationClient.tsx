'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  XCircle, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

interface EvaluationClientProps {
  assignment: {
    id: string;
    deadline: string;
    submission: {
      title: string;
      body_text: string;
    };
  };
}

const MINIMUM_REVIEW_TIME = 10000; // 10 seconds in milliseconds

export default function EvaluationClient({ assignment }: EvaluationClientProps) {
  const router = useRouter();
  const [decision, setDecision] = useState<'ELIMINATE' | 'REINSTATE' | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canSubmit, setCanSubmit] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(MINIMUM_REVIEW_TIME / 1000);
  const pageLoadTime = useRef<number>(Date.now());

  // Enforce minimum review time (10 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      const elapsed = Date.now() - pageLoadTime.current;
      const remaining = Math.max(0, Math.ceil((MINIMUM_REVIEW_TIME - elapsed) / 1000));
      
      setTimeRemaining(remaining);
      
      if (elapsed >= MINIMUM_REVIEW_TIME) {
        setCanSubmit(true);
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Calculate deadline time remaining
  const getDeadlineTimeRemaining = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate.getTime() - now.getTime();
    
    if (diff < 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    return `${hours}h remaining`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!decision || !comment.trim()) {
      setError('Please provide both a decision and a comment');
      return;
    }

    if (comment.length > 100) {
      setError('Comment must be 100 characters or less');
      return;
    }

    // Enforce minimum review time (client-side check)
    if (!canSubmit) {
      setError(`Please take at least 10 seconds to review the submission (${timeRemaining}s remaining)`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/peer-verification/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignment_id: assignment.id,
          decision,
          comment: comment.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit evaluation');
      }

      // Success - redirect to dashboard
      router.push('/dashboard/peer-verification-tasks?submitted=true');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F7] pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <Link 
          href="/dashboard/peer-verification-tasks"
          className="inline-flex items-center text-[#666] hover:text-[#222] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Tasks
        </Link>

        {/* Header */}
        <div className="bg-white border border-[#E5E5E0] rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-serif text-[#222]">
              Peer Verification Review
            </h1>
            <div className="flex items-center gap-2 text-sm text-[#666]">
              <Clock className="w-4 h-4" />
              <span>{getDeadlineTimeRemaining(assignment.deadline)}</span>
            </div>
          </div>

          {/* Blind Review Notice */}
          <div className="bg-[#FFF9E6] border border-[#FFE082] rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#F57C00] flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-[#222] mb-1">Blind Review</p>
              <p className="text-sm text-[#666]">
                You are evaluating this submission without knowing the AI's decision or the author's identity. 
                Make your judgment based solely on the content and quality of the submission.
              </p>
            </div>
          </div>
        </div>

        {/* Submission Display */}
        <div className="bg-white border border-[#E5E5E0] rounded-lg p-8 mb-6">
          <h2 className="text-xl font-serif text-[#222] mb-4">
            {assignment.submission.title}
          </h2>
          <div className="prose prose-lg max-w-none">
            <p className="text-[#444] whitespace-pre-wrap leading-relaxed">
              {assignment.submission.body_text}
            </p>
          </div>
        </div>

        {/* Evaluation Form */}
        <form onSubmit={handleSubmit} className="bg-white border border-[#E5E5E0] rounded-lg p-6">
          <h3 className="text-lg font-serif text-[#222] mb-4">
            Your Evaluation
          </h3>

          {/* Decision Buttons */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#222] mb-3">
              Decision *
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setDecision('ELIMINATE')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  decision === 'ELIMINATE'
                    ? 'border-[#C62828] bg-[#C62828]/5'
                    : 'border-[#E5E5E0] hover:border-[#C62828]/50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <XCircle className={`w-6 h-6 ${
                    decision === 'ELIMINATE' ? 'text-[#C62828]' : 'text-[#666]'
                  }`} />
                  <span className={`font-semibold ${
                    decision === 'ELIMINATE' ? 'text-[#C62828]' : 'text-[#666]'
                  }`}>
                    Eliminate
                  </span>
                </div>
                <p className="text-xs text-[#666] mt-2">
                  This submission should be eliminated
                </p>
              </button>

              <button
                type="button"
                onClick={() => setDecision('REINSTATE')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  decision === 'REINSTATE'
                    ? 'border-[#2E7D32] bg-[#2E7D32]/5'
                    : 'border-[#E5E5E0] hover:border-[#2E7D32]/50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className={`w-6 h-6 ${
                    decision === 'REINSTATE' ? 'text-[#2E7D32]' : 'text-[#666]'
                  }`} />
                  <span className={`font-semibold ${
                    decision === 'REINSTATE' ? 'text-[#2E7D32]' : 'text-[#666]'
                  }`}>
                    Reinstate
                  </span>
                </div>
                <p className="text-xs text-[#666] mt-2">
                  This submission should be reinstated
                </p>
              </button>
            </div>
          </div>

          {/* Comment Field */}
          <div className="mb-6">
            <label htmlFor="comment" className="block text-sm font-medium text-[#222] mb-2">
              Brief Explanation * (max 100 characters)
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={100}
              rows={3}
              className="w-full px-4 py-3 border border-[#E5E5E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6A1B9A] focus:border-transparent resize-none"
              placeholder="Provide a brief explanation for your decision..."
              required
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-[#666]">
                Be concise and specific about your reasoning
              </p>
              <p className={`text-xs ${
                comment.length > 90 ? 'text-[#C62828]' : 'text-[#666]'
              }`}>
                {comment.length}/100
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-[#FFEBEE] border border-[#EF5350] rounded-lg">
              <p className="text-sm text-[#C62828]">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!decision || !comment.trim() || isSubmitting || !canSubmit}
            className="w-full py-3 px-6 bg-[#004D40] text-white rounded-lg font-semibold hover:bg-[#00695C] disabled:bg-[#E5E5E0] disabled:text-[#999] disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting 
              ? 'Submitting...' 
              : !canSubmit 
              ? `Please wait ${timeRemaining}s before submitting` 
              : 'Submit Evaluation'}
          </button>
          
          {!canSubmit && decision && comment.trim() && (
            <p className="text-xs text-[#666] text-center mt-2">
              Take your time to carefully review the submission
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
