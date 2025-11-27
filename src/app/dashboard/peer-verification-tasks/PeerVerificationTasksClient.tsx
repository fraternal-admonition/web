'use client';

import { 
  CheckCircle, 
  Clock, 
  Award,
  AlertCircle,
  ArrowRight,
  FileText
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
}

interface PeerVerificationTasksClientProps {
  assignments: Assignment[];
  user: {
    integrity_score: number;
    qualified_evaluator: boolean;
  };
}

export default function PeerVerificationTasksClient({ 
  assignments, 
  user 
}: PeerVerificationTasksClientProps) {
  // Group assignments by status
  const pendingAssignments = assignments.filter(a => a.status === 'PENDING');
  const completedAssignments = assignments.filter(a => a.status === 'DONE');

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

  return (
    <div className="min-h-screen bg-[#F9F9F7] pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif text-[#222] mb-2">
            Peer Verification Tasks
          </h1>
          <p className="text-[#666]">
            Review submissions to help ensure fair AI decisions
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-[#E5E5E0] rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg text-[#222] mb-2">Pending</h3>
                <p className="text-3xl font-bold text-[#6A1B9A]">{pendingAssignments.length}</p>
              </div>
              <Clock className="w-10 h-10 text-[#6A1B9A] opacity-60" />
            </div>
          </div>

          <div className="bg-white border border-[#E5E5E0] rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg text-[#222] mb-2">Completed</h3>
                <p className="text-3xl font-bold text-[#2E7D32]">{completedAssignments.length}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-[#2E7D32] opacity-60" />
            </div>
          </div>

          <div className="bg-white border border-[#E5E5E0] rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg text-[#222] mb-2">Integrity Score</h3>
                <p className="text-3xl font-bold text-[#C19A43]">{user.integrity_score}</p>
                {user.qualified_evaluator && (
                  <p className="text-sm text-[#666] mt-1">✓ Qualified Evaluator</p>
                )}
              </div>
              <Award className="w-10 h-10 text-[#C19A43] opacity-60" />
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
                  <div key={assignment.id} className="bg-white border border-[#E5E5E0] rounded-lg p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-[#F9F9F7] flex items-center justify-center">
                            <FileText className="w-5 h-5 text-[#6A1B9A]" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-[#222]">
                              Submission Review {index + 1}
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

                        <Link href={`/peer-verification/review/${assignment.id}`}>
                          <button className="inline-flex items-center px-4 py-2 bg-[#004D40] text-white rounded-lg hover:bg-[#00695C] transition-colors">
                            Start Review
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* No Pending Assignments */}
        {pendingAssignments.length === 0 && (
          <div className="bg-white border border-[#E5E5E0] rounded-lg p-12 text-center">
            <CheckCircle className="w-16 h-16 text-[#2E7D32] mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-[#222] mb-2">
              All Caught Up!
            </h3>
            <p className="text-[#666]">
              You have no pending peer verification tasks at the moment.
            </p>
          </div>
        )}

        {/* Completed Assignments */}
        {completedAssignments.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-serif text-[#222] mb-4">
              Completed Reviews
            </h2>
            <div className="space-y-3">
              {completedAssignments.map((assignment) => (
                <div key={assignment.id} className="bg-white border border-[#E5E5E0] rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-[#2E7D32]" />
                    <div>
                      <p className="font-medium text-[#222]">
                        {assignment.submissions?.submission_code || 'N/A'}
                      </p>
                      <p className="text-sm text-[#666]">
                        Completed {new Date(assignment.completed_at!).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
