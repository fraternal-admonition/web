'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, AlertCircle, FileText, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface AssignmentCardProps {
  assignment: {
    id: string;
    deadline: string;
    assigned_at: string;
    submissions: {
      submission_code: string;
    };
  };
  index: number;
}

export default function AssignmentCard({ assignment, index }: AssignmentCardProps) {
  // Calculate time remaining
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

  const timeRemaining = getTimeRemaining(assignment.deadline);

  return (
    <Card className="p-6 hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-[#6A1B9A]/20">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-[#6A1B9A]/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-[#6A1B9A]" />
            </div>
            <div>
              <h3 className="font-semibold text-[#222]">
                Submission Review {index + 1}
              </h3>
              <p className="text-sm text-[#666]">
                Code: {assignment.submissions.submission_code}
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
            <Button className="bg-[#6A1B9A] hover:bg-[#8E24AA] transition-colors">
              Start Review
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
