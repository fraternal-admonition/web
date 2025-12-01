'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, AlertCircle, CheckCircle } from 'lucide-react';
import CriteriaRating from '@/components/peer-review/CriteriaRating';
import CommentInput from '@/components/peer-review/CommentInput';

interface Assignment {
  id: string;
  submission_id: string;
  reviewer_user_id: string;
  status: string;
  assigned_at: string;
  completed_at: string | null;
  deadline: string;
  submissions: {
    id: string;
    submission_code: string;
    title: string;
    body_text: string;
  };
}

interface ReviewClientProps {
  assignment: Assignment;
  currentIndex: number;
  totalAssignments: number;
}

export default function ReviewClient({
  assignment,
  currentIndex,
  totalAssignments,
}: ReviewClientProps) {
  const router = useRouter();
  const [clarity, setClarity] = useState<number>(0);
  const [argument, setArgument] = useState<number>(0);
  const [style, setStyle] = useState<number>(0);
  const [moralDepth, setMoralDepth] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allCriteriaRated = clarity > 0 && argument > 0 && style > 0 && moralDepth > 0;
  const canSubmit = allCriteriaRated && comment.trim().length > 0 && !isSubmitting;

  // Calculate time remaining
  const deadline = new Date(assignment.deadline);
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();
  const daysRemaining = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hoursRemaining = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/peer-review/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignment_id: assignment.id,
          clarity,
          argument,
          style,
          moral_depth: moralDepth,
          comment,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit review');
      }

      // Success! Navigate back to tasks
      router.push('/dashboard/peer-review-tasks?success=true');
    } catch (err) {
      console.error('Error submitting review:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit review');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F7] pt-20 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-serif text-[#222] mb-2">
                Review {currentIndex + 1} of {totalAssignments}
              </h1>
              <p className="text-[#666]">
                Submission Code: <span className="font-mono font-semibold text-[#6A1B9A]">{assignment.submissions.submission_code}</span>
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-sm text-[#666] mb-1">
                <Clock className="w-4 h-4" />
                <span>
                  {daysRemaining}d {hoursRemaining}h remaining
                </span>
              </div>
              <p className="text-xs text-[#888]">
                Deadline: {deadline.toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Anonymous Notice */}
          <div className="bg-[#F3E5F5] border border-[#CE93D8] rounded-lg p-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#6A1B9A] flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-[#6A1B9A] mb-2">
                  Anonymous Review
                </h3>
                <p className="text-sm text-[#6A1B9A] leading-relaxed">
                  You are evaluating this submission anonymously. Rate it based solely on the content. Author identity, AI scores, and other reviews are hidden.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Submission Display */}
        <div className="bg-white border border-[#E5E5E0] rounded-lg p-10 mb-12">
          <h2 className="text-2xl font-serif text-[#222] mb-6">
            {assignment.submissions.title}
          </h2>
          <div className="prose prose-lg max-w-none">
            <div className="whitespace-pre-wrap text-[#444] leading-relaxed text-lg">
              {assignment.submissions.body_text}
            </div>
          </div>
        </div>

        {/* Review Form */}
        <form onSubmit={handleSubmit} className="bg-white border border-[#E5E5E0] rounded-lg p-10">
          <h2 className="text-xl font-serif text-[#222] mb-8">
            Your Evaluation
          </h2>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-8">
            <CriteriaRating
              label="Clarity"
              description="How clear and understandable is the writing?"
              value={clarity}
              onChange={setClarity}
            />

            <CriteriaRating
              label="Argument"
              description="How strong and well-supported is the argument?"
              value={argument}
              onChange={setArgument}
            />

            <CriteriaRating
              label="Style"
              description="How engaging and effective is the writing style?"
              value={style}
              onChange={setStyle}
            />

            <CriteriaRating
              label="Moral Depth"
              description="How profound is the moral or philosophical insight?"
              value={moralDepth}
              onChange={setMoralDepth}
            />

            <CommentInput
              value={comment}
              onChange={setComment}
              maxLength={100}
            />

            <div className="flex items-center justify-between pt-8 mt-8 border-t border-[#E5E5E0]">
              <button
                type="button"
                onClick={() => router.push('/dashboard/peer-review-tasks')}
                className="px-6 py-3 border border-[#E5E5E0] text-[#666] rounded-lg hover:bg-[#F9F9F7] transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={!canSubmit}
                className={`flex items-center gap-2 px-8 py-3 rounded-lg font-semibold transition-colors ${
                  canSubmit
                    ? 'bg-[#6A1B9A] text-white hover:bg-[#8E24AA]'
                    : 'bg-[#E5E5E0] text-[#888] cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Submit Review
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
