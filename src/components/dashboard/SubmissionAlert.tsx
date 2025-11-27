"use client";

import Link from "next/link";
import { getDeadlineMessage } from "@/lib/contests/phase-utils";

interface SubmissionAlertProps {
  submission: {
    id: string;
    submission_code: string;
    title: string;
    contest?: {
      id: string;
      title: string;
      submissions_close_at: string | null;
    };
  };
}

export default function SubmissionAlert({ submission }: SubmissionAlertProps) {
  const deadline = submission.contest?.submissions_close_at;
  const deadlineMessage = deadline ? getDeadlineMessage(deadline) : null;
  const deadlinePassed = deadline ? new Date() >= new Date(deadline) : false;

  return (
    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-400 rounded-lg p-6 mb-4 shadow-md">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6 text-yellow-900"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-yellow-900 mb-1">
            ⚠️ Payment Required
          </h3>
          <p className="text-yellow-800 mb-3">
            Your submission is saved but not yet entered into the contest. Complete payment to finalize your entry.
          </p>

          {/* Submission Details */}
          <div className="bg-white/60 rounded-lg p-4 mb-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-yellow-700 font-medium mb-1">Submission Code</p>
                <p className="text-sm font-mono font-bold text-yellow-900">
                  {submission.submission_code}
                </p>
              </div>
              <div>
                <p className="text-xs text-yellow-700 font-medium mb-1">Title</p>
                <p className="text-sm font-semibold text-yellow-900 truncate">
                  {submission.title}
                </p>
              </div>
            </div>

            {/* Deadline Warning */}
            {deadlineMessage && !deadlinePassed && (
              <div className="mt-3 pt-3 border-t border-yellow-200">
                <div className="flex items-center gap-2 text-yellow-800">
                  <svg
                    className="w-4 h-4 flex-shrink-0"
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
                  <span className="text-xs font-semibold">
                    Deadline: {deadlineMessage}
                  </span>
                </div>
              </div>
            )}

            {deadlinePassed && (
              <div className="mt-3 pt-3 border-t border-red-200">
                <p className="text-xs text-red-700 font-semibold">
                  ⏰ Deadline has passed - payment no longer available
                </p>
              </div>
            )}
          </div>

          {/* Action Button */}
          {!deadlinePassed ? (
            <Link
              href={`/contest/payment/${submission.id}`}
              className="inline-flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-yellow-900 font-semibold px-6 py-3 rounded-lg transition-colors shadow-sm"
            >
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
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
              Complete Payment ($7)
            </Link>
          ) : (
            <div className="text-sm text-red-700 font-medium">
              This submission can no longer be paid for as the deadline has passed.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
