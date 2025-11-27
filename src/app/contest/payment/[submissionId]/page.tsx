import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import Image from "next/image";
import PaymentButton from "@/components/contest/PaymentButton";
import { getDeadlineMessage } from "@/lib/contests/phase-utils";

interface PageProps {
  params: Promise<{
    submissionId: string;
  }>;
}

export const metadata = {
  title: "Complete Payment",
  description: "Complete your contest entry payment",
};

export default async function PaymentPage({ params }: PageProps) {
  const { submissionId } = await params;
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/signin");
  }

  // Fetch submission with related data
  const { data: submission, error: submissionError } = await supabase
    .from("submissions")
    .select(`
      *,
      illustration:illustrations(
        id,
        title,
        asset:cms_assets(path, alt)
      ),
      contest:contests(
        id,
        title,
        submissions_close_at,
        phase
      )
    `)
    .eq("id", submissionId)
    .single();

  if (submissionError || !submission) {
    notFound();
  }

  // Verify ownership
  if (submission.user_id !== user.id) {
    redirect("/contest");
  }

  // Check if already paid
  if (submission.status === "SUBMITTED") {
    redirect(`/contest/confirmation/${submissionId}`);
  }

  // Check if status is PENDING_PAYMENT
  if (submission.status !== "PENDING_PAYMENT") {
    redirect("/contest");
  }

  // Check if deadline has passed
  const deadline = submission.contest?.submissions_close_at;
  const deadlinePassed = deadline ? new Date() >= new Date(deadline) : false;

  if (deadlinePassed) {
    return (
      <div className="min-h-screen bg-[#F9F9F7] pt-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <div className="text-5xl mb-4">⏰</div>
            <h2 className="text-2xl font-serif text-[#222] mb-4">
              Submission Deadline Passed
            </h2>
            <p className="text-[#666] leading-relaxed mb-6">
              Unfortunately, the submission deadline has passed and we can no
              longer accept payments for this contest.
            </p>
            <a
              href="/contest"
              className="inline-block bg-[#004D40] text-white px-6 py-3 rounded-lg hover:bg-[#003830] transition-colors"
            >
              Return to Contest
            </a>
          </div>
        </div>
      </div>
    );
  }

  const deadlineMessage = deadline ? getDeadlineMessage(deadline) : null;

  return (
    <div className="min-h-screen bg-[#F9F9F7] pt-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-serif text-[#222] mb-2">
            Complete Your <span className="text-[#C19A43]">Entry</span>
          </h1>
          <p className="text-[#666]">
            Pay the $7 entry fee to submit your letter
          </p>
        </div>

        {/* Deadline Warning */}
        {deadlineMessage && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-900">
              <svg
                className="w-5 h-5 flex-shrink-0"
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
              <span className="font-semibold">Payment deadline: {deadlineMessage}</span>
            </div>
          </div>
        )}

        {/* Submission Details Card */}
        <div className="bg-white border border-[#E5E5E0] rounded-lg p-8 mb-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-serif text-[#222]">
                Submission Details
              </h2>
              <div className="px-3 py-1 bg-yellow-50 border border-yellow-200 rounded-full">
                <span className="text-sm font-medium text-yellow-800">
                  Pending Payment
                </span>
              </div>
            </div>

            {/* Submission Code */}
            <div className="mb-6 p-6 bg-gradient-to-br from-[#004D40] to-[#00695C] rounded-lg border-2 border-[#004D40] shadow-lg">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-[#C19A43]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <p className="text-sm font-medium text-white/90">Your Submission Code</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-md px-4 py-3 mb-3">
                <p className="text-3xl font-mono font-bold text-white tracking-wider text-center">
                  {submission.submission_code}
                </p>
              </div>
              <p className="text-xs text-white/80 text-center">
                💾 Save this code to track your submission anonymously
              </p>
            </div>

            {/* Title */}
            <div className="mb-4">
              <p className="text-sm text-[#666] mb-1">Title</p>
              <p className="text-lg font-medium text-[#222]">
                {submission.title}
              </p>
            </div>

            {/* Body Preview */}
            <div className="mb-4">
              <p className="text-sm text-[#666] mb-1">Letter Preview</p>
              <p className="text-[#222] line-clamp-3">
                {submission.body_text}
              </p>
            </div>

            {/* Illustration */}
            {submission.illustration && (
              <div>
                <p className="text-sm text-[#666] mb-2">Selected Illustration</p>
                {submission.illustration.asset?.path ? (
                  <div className="mt-3">
                    <div className="relative aspect-[4/3] w-full max-w-md rounded-lg overflow-hidden border border-[#E5E5E0]">
                      <Image
                        src={submission.illustration.asset.path}
                        alt={submission.illustration.asset.alt || submission.illustration.title || "Selected illustration"}
                        fill
                        className="object-cover"
                      />
                    </div>
                    {submission.illustration.title && (
                      <p className="text-[#222] font-medium mt-2">
                        {submission.illustration.title}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-[#222] font-medium">
                    {submission.illustration.title}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Payment Card */}
        <div className="bg-white border border-[#E5E5E0] rounded-lg p-8 mb-6">
          <h2 className="text-xl font-serif text-[#222] mb-6">
            Entry Fee Payment
          </h2>

          <div className="flex items-center justify-between mb-6 pb-6 border-b border-[#E5E5E0]">
            <div>
              <p className="text-[#666] mb-1">Contest Entry Fee</p>
              <p className="text-sm text-[#999]">
                {submission.contest?.title}
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-[#004D40]">$7</p>
              <p className="text-sm text-[#666]">USD</p>
            </div>
          </div>

          <PaymentButton submissionId={submissionId} />

          <div className="mt-6 pt-6 border-t border-[#E5E5E0]">
            <div className="flex items-start gap-2 text-sm text-[#666]">
              <svg
                className="w-5 h-5 flex-shrink-0 text-[#004D40]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <div>
                <p className="font-medium text-[#222] mb-1">
                  Secure Payment via Stripe
                </p>
                <p>
                  Your payment information is processed securely. We never store
                  your credit card details.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">
            📋 What happens next?
          </h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• You'll be redirected to Stripe to complete payment</li>
            <li>• After payment, your submission will be officially entered</li>
            <li>• You'll receive a confirmation email with your submission code</li>
            <li>• Your letter will proceed to the AI filtering round</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
