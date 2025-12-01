'use client';

import { 
  CheckCircle, 
  Clock, 
  AlertCircle,
  ArrowRight,
  FileText,
  Star
} from 'lucide-react';
import Link from 'next/link';

interface Assignment {
  id: string;
  submission_id: string;
  reviewer_user_id: string;
  status: 'PENDING' | 'DONE' | 'EXPIRED';
  assigned_at: string;
  completed_at: string | null;
  deadline: string;
  submissions: {
    id: string;
    title: string;
    body_text: string;
    status: string;
    submission_code: string;
  };
  peer_review_reviews?: {
    id: string;
    clarity: number;
    argument: number;
    style: number;
    moral_depth: number;
    comment_100: string;
    created_at: string;
  } | null;
}

interface PeerReviewTasksClientProps {
  assignments: Assignment[];
}

export default function PeerReviewTasksClient({ 
  assignments
}: PeerReviewTasksClientProps) {
  // Group assignments by status
  const pendingAssignments = assignments.filter(a => a.status === 'PENDING');
  const completedAssignments = assignments.filter(a => a.status === 'DONE');
  const totalAssignments = assignments.length;

  // Calculate time remaining for pending assignments
  const getTimeRemaining = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate.getTime() - now.getTime();
    
    if (diff < 0) return { text: 'Expired', color: 'text-red-600' };
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 2) return { text: `${days}d ${hours}h`, color: 'text-green-600' };
    if (days > 0) return { text: `${days}d ${hours}h`, color: 'text-yellow-600' };
    return { text: `${hours}h`, color: 'text-red-600' };
  };

  // Get earliest deadline
  const earliestDeadline = pendingAssignments.length > 0
    ? pendingAssignments.reduce((earliest, assignment) => {
        const assignmentDeadline = new Date(assignment.deadline);
        return assignmentDeadline < earliest ? assignmentDeadline : earliest;
      }, new Date(pendingAssignments[0].deadline))
    : null;

  // Check if near deadline with incomplete reviews
  const isNearDeadline = earliestDeadline 
    ? (earliestDeadline.getTime() - new Date().getTime()) < (48 * 60 * 60 * 1000) // 48 hours
    : false;

  return (
    <div className="min-h-screen bg-[#F9F9F7] pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif text-[#222] mb-2">
            Peer Review Tasks
          </h1>
          <p className="text-[#666]">
            Evaluate fellow submissions to help determine finalists
          </p>
        </div>

        {/* Progress Card */}
        <div className="bg-gradient-to-br from-[#6A1B9A] to-[#8E24AA] text-white rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-serif mb-1">Your Progress</h2>
              <p className="text-white/80 text-sm">
                {completedAssignments.length} of {totalAssignments} reviews completed
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">
                {totalAssignments > 0 
                  ? Math.round((completedAssignments.length / totalAssignments) * 100)
                  : 0}%
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-white h-full rounded-full transition-all duration-500"
              style={{ 
                width: `${totalAssignments > 0 
                  ? (completedAssignments.length / totalAssignments) * 100 
                  : 0}%` 
              }}
            />
          </div>

          {earliestDeadline && (
            <div className="mt-4 flex items-center gap-2 text-sm text-white/90">
              <Clock className="w-4 h-4" />
              <span>
                Earliest deadline: {earliestDeadline.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          )}
        </div>

        {/* Disqualification Warning */}
        {pendingAssignments.length > 0 && isNearDeadline && (
          <div className="bg-[#FFF9E6] border border-[#FFE082] rounded-lg p-4 mb-8">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#856404] flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-[#856404] mb-1">
                  ⚠️ Deadline Approaching
                </h3>
                <p className="text-sm text-[#856404]">
                  Complete all reviews by the deadline to avoid disqualification. Your own submission depends on fulfilling your review obligations.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white border border-[#E5E5E0] rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg text-[#222] mb-2">Pending Reviews</h3>
                <p className="text-3xl font-bold text-[#6A1B9A]">{pendingAssignments.length}</p>
              </div>
              <Clock className="w-10 h-10 text-[#6A1B9A] opacity-60" />
            </div>
          </div>

          <div className="bg-white border border-[#E5E5E0] rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg text-[#222] mb-2">Completed Reviews</h3>
                <p className="text-3xl font-bold text-[#2E7D32]">{completedAssignments.length}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-[#2E7D32] opacity-60" />
            </div>
          </div>
        </div>

        {/* Pending Assignments */}
        {pendingAssignments.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-serif text-[#222] mb-4">
              Pending Reviews
            </h2>
            <div className="space-y-4">
              {pendingAssignments.map((assignment, index) => {
                const timeRemaining = getTimeRemaining(assignment.deadline);
                return (
                  <div key={assignment.id} className="bg-white border border-[#E5E5E0] rounded-lg p-6 hover:border-[#6A1B9A] transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-[#F3E5F5] flex items-center justify-center">
                            <FileText className="w-5 h-5 text-[#6A1B9A]" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-[#222]">
                              Review {index + 1} of {totalAssignments}
                            </h3>
                            <p className="text-sm text-[#666]">
                              Code: {assignment.submissions?.submission_code || 'N/A'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm mb-4">
                          <div className="flex items-center gap-1">
                            <Clock className={`w-4 h-4 ${timeRemaining.color}`} />
                            <span className={timeRemaining.color}>
                              {timeRemaining.text} remaining
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-[#666]">
                            <AlertCircle className="w-4 h-4" />
                            <span>Assigned {new Date(assignment.assigned_at).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <p className="text-sm text-[#666] mb-4">
                          Evaluate this submission on four criteria: Clarity, Argument, Style, and Moral Depth
                        </p>
                      </div>

                      <Link
                        href={`/peer-review/review/${assignment.id}`}
                        className="flex items-center gap-2 px-6 py-3 bg-[#6A1B9A] text-white rounded-lg hover:bg-[#8E24AA] transition-colors whitespace-nowrap"
                      >
                        Start Review
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Completed Assignments */}
        {completedAssignments.length > 0 && (
          <div>
            <h2 className="text-xl font-serif text-[#222] mb-4">
              Completed Reviews
            </h2>
            <div className="space-y-4">
              {completedAssignments.map((assignment, index) => {
                const review = assignment.peer_review_reviews;
                const avgScore = review 
                  ? ((review.clarity + review.argument + review.style + review.moral_depth) / 4).toFixed(1)
                  : 'N/A';

                return (
                  <div key={assignment.id} className="bg-white border border-[#E5E5E0] rounded-lg p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-[#E8F5E9] flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-[#2E7D32]" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-[#222]">
                              Review {index + 1} - Completed
                            </h3>
                            <p className="text-sm text-[#666]">
                              Code: {assignment.submissions?.submission_code || 'N/A'}
                            </p>
                          </div>
                        </div>
                        
                        {review && (
                          <div className="space-y-2 mb-3">
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-[#C19A43]" />
                                <span className="text-[#666]">Average Score:</span>
                                <span className="font-semibold text-[#222]">{avgScore}/5</span>
                              </div>
                            </div>
                            <div className="grid grid-cols-4 gap-2 text-xs">
                              <div className="bg-[#F9F9F7] rounded px-2 py-1">
                                <span className="text-[#666]">Clarity:</span> <span className="font-semibold">{review.clarity}</span>
                              </div>
                              <div className="bg-[#F9F9F7] rounded px-2 py-1">
                                <span className="text-[#666]">Argument:</span> <span className="font-semibold">{review.argument}</span>
                              </div>
                              <div className="bg-[#F9F9F7] rounded px-2 py-1">
                                <span className="text-[#666]">Style:</span> <span className="font-semibold">{review.style}</span>
                              </div>
                              <div className="bg-[#F9F9F7] rounded px-2 py-1">
                                <span className="text-[#666]">Moral:</span> <span className="font-semibold">{review.moral_depth}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-sm text-[#666]">
                          <div className="flex items-center gap-1">
                            <CheckCircle className="w-4 h-4 text-[#2E7D32]" />
                            <span>Completed {assignment.completed_at ? new Date(assignment.completed_at).toLocaleDateString() : 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {assignments.length === 0 && (
          <div className="bg-white border border-[#E5E5E0] rounded-lg p-12 text-center">
            <FileText className="w-16 h-16 text-[#666] mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-serif text-[#222] mb-2">
              No Peer Review Assignments Yet
            </h3>
            <p className="text-[#666] max-w-md mx-auto">
              You'll receive peer review assignments when the contest enters the peer review phase. Check back later!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
