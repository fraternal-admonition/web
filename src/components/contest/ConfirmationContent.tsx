"use client";

import { useState } from "react";
import Link from "next/link";

interface ConfirmationContentProps {
  submission: {
    submission_code: string;
    title: string;
    submitted_at: string | null;
    contest?: {
      title: string;
    } | null;
  };
  userEmail: string;
}

export default function ConfirmationContent({
  submission,
  userEmail,
}: ConfirmationContentProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(submission.submission_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F9F9F7] pt-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Success Animation */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6 animate-bounce">
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl md:text-4xl font-serif text-[#222] mb-2">
            Submission <span className="text-[#C19A43]">Confirmed!</span>
          </h1>
          <p className="text-lg text-[#666]">
            Your letter has been successfully submitted to the contest
          </p>
        </div>

        {/* Submission Code Card */}
        <div className="bg-white border border-[#E5E5E0] rounded-lg p-8 mb-6">
          <div className="text-center mb-6">
            <p className="text-sm text-[#666] mb-2">Your Submission Code</p>
            <div className="inline-block p-6 bg-gradient-to-br from-[#004D40] to-[#00695C] rounded-lg mb-4">
              <p className="text-4xl font-mono font-bold text-white tracking-wider">
                {submission.submission_code}
              </p>
            </div>
            <button
              onClick={handleCopy}
              className="text-sm text-[#004D40] hover:text-[#003830] font-medium flex items-center gap-2 mx-auto transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              {copied ? "Copied!" : "Copy to clipboard"}
            </button>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 flex-shrink-0 text-yellow-600 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="text-sm text-yellow-900">
                <p className="font-semibold mb-1">Save this code!</p>
                <p>
                  Your submission is tracked anonymously using this code. You'll
                  need it to check your status and results.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Submission Details */}
        <div className="bg-white border border-[#E5E5E0] rounded-lg p-8 mb-6">
          <h2 className="text-xl font-serif text-[#222] mb-4">
            Submission Details
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-[#666]">Contest</p>
              <p className="text-[#222] font-medium">
                {submission.contest?.title}
              </p>
            </div>
            <div>
              <p className="text-sm text-[#666]">Title</p>
              <p className="text-[#222] font-medium">{submission.title}</p>
            </div>
            <div>
              <p className="text-sm text-[#666]">Submitted</p>
              <p className="text-[#222]">
                {submission.submitted_at
                  ? new Date(submission.submitted_at).toLocaleDateString(
                      "en-US",
                      {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      }
                    )
                  : "Just now"}
              </p>
            </div>
          </div>
        </div>

        {/* Email Confirmation Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3">
            <svg
              className="w-6 h-6 flex-shrink-0 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">Confirmation Email Sent</p>
              <p>
                We've sent a confirmation email to <strong>{userEmail}</strong>{" "}
                with your submission code and payment receipt.
              </p>
            </div>
          </div>
        </div>

        {/* What's Next */}
        <div className="bg-white border border-[#E5E5E0] rounded-lg p-8 mb-6">
          <h2 className="text-xl font-serif text-[#222] mb-4">
            What Happens Next?
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-[#004D40] text-white rounded-full flex items-center justify-center font-bold text-sm">
                1
              </div>
              <div>
                <p className="font-medium text-[#222] mb-1">AI Filtering</p>
                <p className="text-sm text-[#666]">
                  Your submission will be reviewed by our AI system to ensure it
                  meets contest guidelines.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-[#004D40] text-white rounded-full flex items-center justify-center font-bold text-sm">
                2
              </div>
              <div>
                <p className="font-medium text-[#222] mb-1">Peer Review</p>
                <p className="text-sm text-[#666]">
                  Qualified submissions will be reviewed by fellow participants
                  in the peer review phase.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-[#004D40] text-white rounded-full flex items-center justify-center font-bold text-sm">
                3
              </div>
              <div>
                <p className="font-medium text-[#222] mb-1">Public Voting</p>
                <p className="text-sm text-[#666]">
                  Top submissions will advance to public voting where the
                  community decides the finalists.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-[#C19A43] text-white rounded-full flex items-center justify-center font-bold text-sm">
                4
              </div>
              <div>
                <p className="font-medium text-[#222] mb-1">Winner Announcement</p>
                <p className="text-sm text-[#666]">
                  The winning submission will be announced and published on our
                  platform.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/dashboard"
            className="flex-1 bg-[#004D40] text-white px-6 py-3 rounded-lg hover:bg-[#003830] transition-colors text-center font-medium"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/contest"
            className="flex-1 bg-white border border-[#E5E5E0] text-[#222] px-6 py-3 rounded-lg hover:bg-[#F9F9F7] transition-colors text-center font-medium"
          >
            View Contest Details
          </Link>
        </div>
      </div>
    </div>
  );
}
