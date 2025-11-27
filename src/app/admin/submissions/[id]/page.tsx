"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import UpdateStatusButton from "./UpdateStatusButton";
import OverrideScreeningButton from "./OverrideScreeningButton";
import ScreeningDetailsModal from "./ScreeningDetailsModal";

function SubmissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submission, setSubmission] = useState<any>(null);

  // Unwrap params
  useEffect(() => {
    params.then((p) => setSubmissionId(p.id));
  }, [params]);

  // Fetch submission data
  useEffect(() => {
    if (!submissionId) return;

    const fetchSubmission = async () => {
      try {
        const response = await fetch(`/api/admin/submissions/${submissionId}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to fetch submission");
        }

        setSubmission(result.data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load submission");
        setLoading(false);
      }
    };

    fetchSubmission();
  }, [submissionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center">
        <div className="text-[#666]">Loading submission...</div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center">
        <div className="text-red-600">{error || "Submission not found"}</div>
      </div>
    );
  }

  const statusStyles: Record<string, string> = {
    PENDING_PAYMENT: "bg-yellow-100 text-yellow-800 border-yellow-300",
    SUBMITTED: "bg-green-100 text-green-800 border-green-300",
    DISQUALIFIED: "bg-red-100 text-red-800 border-red-300",
    FINALIST: "bg-blue-100 text-blue-800 border-blue-300",
    WINNER: "bg-purple-100 text-purple-800 border-purple-300",
  };

  const payments = submission.payment || [];
  
  // Map payment purposes to readable labels
  const paymentPurposeLabels: Record<string, string> = {
    ENTRY_FEE: "Entry Fee",
    PEER_VERIFICATION: "Peer Verification",
    VOTE_BUNDLE: "Vote Bundle",
    CERTIFICATION_FEE: "Certification Fee",
    DONATION: "Donation",
    OTHER: "Other",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F9F9F7] via-white to-[#FEFEFE]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with breadcrumb */}
        <div className="mb-8">
          <Link
            href="/admin/submissions"
            className="inline-flex items-center gap-2 text-sm text-[#666] hover:text-[#004D40] transition-all hover:gap-3 mb-6"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Submissions
          </Link>

          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-5xl font-serif text-[#222] mb-3 leading-tight">
                Submission <span className="text-[#C19A43]">Details</span>
              </h1>
              <p className="text-lg text-[#666]">Review and manage submission information</p>
            </div>
            <div className="flex flex-col items-end gap-3">
              <span className={`inline-flex items-center px-6 py-3 rounded-full text-sm font-bold border-2 ${statusStyles[submission.status] || "bg-gray-100 text-gray-800"} shadow-lg hover:shadow-xl transition-shadow`}>
                {submission.status.replace(/_/g, " ")}
              </span>
              <span className="text-xs text-[#888] font-mono">ID: {submission.id.slice(0, 8)}...</span>
            </div>
          </div>
        </div>

        {/* Submission Code Card - Hero Style */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#004D40] via-[#00695C] to-[#004D40] rounded-2xl p-10 mb-8 shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#C19A43] opacity-10 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-[#C19A43]/20 rounded-lg">
                <svg className="w-6 h-6 text-[#C19A43]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <p className="text-sm font-bold text-white/90 uppercase tracking-widest">Submission Code</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl px-8 py-6 mb-4 border border-white/20">
              <p className="text-6xl font-mono font-black text-white tracking-widest text-center drop-shadow-lg">
                {submission.submission_code}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-white/70">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Anonymous tracking code - do not share user identity</span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* User Info Card */}
          <div className="group bg-white rounded-2xl shadow-md border border-[#E5E5E0] p-8 hover:shadow-xl hover:border-[#004D40]/20 transition-all duration-300">
            <h2 className="text-xl font-serif text-[#222] mb-6 flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#004D40] to-[#00695C] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span className="font-bold">User Information</span>
            </h2>
            <dl className="space-y-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-[#C19A43] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <div className="flex-1">
                  <dt className="text-xs font-semibold text-[#666] uppercase tracking-wide mb-1">Email</dt>
                  <dd className="text-sm font-medium text-[#222]">{submission.user?.email || "Unknown"}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-[#C19A43] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                </svg>
                <div className="flex-1">
                  <dt className="text-xs font-semibold text-[#666] uppercase tracking-wide mb-1">User ID</dt>
                  <dd className="text-xs font-mono text-[#666] break-all">{submission.user_id}</dd>
                </div>
              </div>
            </dl>
          </div>

          {/* Contest Info Card */}
          <div className="group bg-white rounded-2xl shadow-md border border-[#E5E5E0] p-8 hover:shadow-xl hover:border-[#C19A43]/20 transition-all duration-300">
            <h2 className="text-xl font-serif text-[#222] mb-6 flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#C19A43] to-[#D4AF37] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <span className="font-bold">Contest Information</span>
            </h2>
            <dl className="space-y-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-[#C19A43] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                <div className="flex-1">
                  <dt className="text-xs font-semibold text-[#666] uppercase tracking-wide mb-1">Contest</dt>
                  <dd className="text-sm font-medium text-[#222]">{submission.contest?.title}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-[#C19A43] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <div className="flex-1">
                  <dt className="text-xs font-semibold text-[#666] uppercase tracking-wide mb-1">Phase</dt>
                  <dd className="text-sm font-medium text-[#222]">{submission.contest?.phase.replace(/_/g, " ")}</dd>
                </div>
              </div>
            </dl>
          </div>
        </div>

        <div className="space-y-8">
          {/* Submission Content Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-[#E5E5E0] p-10 hover:shadow-xl transition-shadow">
            <h2 className="text-3xl font-serif text-[#222] mb-8 flex items-center gap-4 pb-4 border-b-2 border-[#E5E5E0]">
              <div className="p-3 bg-gradient-to-br from-[#C19A43]/10 to-[#D4AF37]/10 rounded-xl">
                <svg className="w-7 h-7 text-[#C19A43]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="font-bold">Submission Content</span>
            </h2>

            <div className="space-y-6">
              <div>
                <dt className="text-xs font-semibold text-[#666] uppercase tracking-wide mb-2">Title</dt>
                <dd className="text-2xl font-bold text-[#222] leading-tight">
                  {submission.title}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-semibold text-[#666] uppercase tracking-wide mb-3">Letter Body</dt>
                <dd className="text-[#222] leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere bg-gradient-to-br from-[#F9F9F7] to-[#FEFEFE] p-6 rounded-xl border border-[#E5E5E0] shadow-inner">
                  {submission.body_text}
                </dd>
              </div>

              {submission.image_note_100 && (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                  <dt className="text-xs font-semibold text-blue-900 uppercase tracking-wide mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    Illustration Note
                  </dt>
                  <dd className="text-sm text-blue-900 italic">
                    "{submission.image_note_100}"
                  </dd>
                </div>
              )}

              {submission.illustration?.asset?.path && (
                <div>
                  <dt className="text-xs font-semibold text-[#666] uppercase tracking-wide mb-3">Selected Illustration</dt>
                  <dd>
                    <div className="space-y-3">
                      <div className="relative aspect-[4/3] w-full max-w-2xl rounded-xl overflow-hidden border-2 border-[#E5E5E0] shadow-lg">
                        <Image
                          src={submission.illustration.asset.path}
                          alt={submission.illustration.asset.alt || submission.illustration.title || "Illustration"}
                          fill
                          className="object-cover"
                        />
                      </div>
                      {submission.illustration.title && (
                        <p className="text-sm font-medium text-[#666]">{submission.illustration.title}</p>
                      )}
                    </div>
                  </dd>
                </div>
              )}
            </div>
          </div>

          {/* Payment Info Card */}
          {payments.length > 0 && (
            <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-green-50 rounded-2xl shadow-lg border-2 border-green-300 p-8 hover:shadow-xl transition-shadow">
              <h2 className="text-2xl font-serif text-[#222] mb-6 flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <span className="font-bold">Payment Information</span>
                <span className="ml-auto text-sm font-semibold text-green-700 bg-white/60 px-3 py-1 rounded-full">
                  {payments.length} {payments.length === 1 ? 'Payment' : 'Payments'}
                </span>
              </h2>
              
              <div className="space-y-4">
                {payments.map((payment: any, index: number) => (
                  <div key={payment.id} className="bg-white/80 rounded-xl p-6 border border-green-200 shadow-sm hover:shadow-md transition-shadow">
                    {/* Payment Purpose Badge */}
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-green-100">
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-800 rounded-lg text-sm font-bold">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {paymentPurposeLabels[payment.purpose] || payment.purpose}
                      </span>
                      <span className="text-xs text-gray-500">Payment #{index + 1}</span>
                    </div>
                    
                    <dl className="grid md:grid-cols-2 gap-4">
                      <div className="bg-green-50/50 rounded-lg p-3">
                        <dt className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">Amount</dt>
                        <dd className="text-lg font-bold text-green-900">${payment.amount} {payment.currency}</dd>
                      </div>
                      <div className="bg-green-50/50 rounded-lg p-3">
                        <dt className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">Status</dt>
                        <dd className="text-sm font-semibold text-green-900 uppercase">{payment.status}</dd>
                      </div>
                      {payment.external_ref && (
                        <div className="bg-green-50/50 rounded-lg p-3 md:col-span-2">
                          <dt className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">
                            {payment.external_ref.startsWith('pi_') ? 'Payment Intent ID' : 
                             payment.external_ref.startsWith('ch_') ? 'Charge ID' : 
                             'Payment Reference'}
                          </dt>
                          <dd className="text-xs font-mono text-green-800 break-all flex items-center gap-2">
                            <span>{payment.external_ref}</span>
                            {(payment.external_ref.startsWith('pi_') || payment.external_ref.startsWith('ch_')) && (
                              <a
                                href={`https://dashboard.stripe.com/${payment.external_ref.startsWith('pi_') ? 'payments' : 'charges'}/${payment.external_ref}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-green-600 hover:text-green-800 transition-colors"
                                title="View in Stripe Dashboard"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            )}
                          </dd>
                        </div>
                      )}
                      <div className="bg-green-50/50 rounded-lg p-3 md:col-span-2">
                        <dt className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">Payment Date</dt>
                        <dd className="text-sm text-green-900">{new Date(payment.created_at).toLocaleString()}</dd>
                      </div>
                    </dl>
                  </div>
                ))}
              </div>
              
              {/* Total Summary */}
              {payments.length > 1 && (
                <div className="mt-6 pt-6 border-t-2 border-green-200">
                  <div className="flex items-center justify-between bg-white/80 rounded-lg p-4">
                    <span className="text-sm font-bold text-green-900 uppercase tracking-wide">Total Paid</span>
                    <span className="text-2xl font-bold text-green-900">
                      ${payments.reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0).toFixed(2)} USD
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Timestamps Card */}
          <div className="bg-white rounded-2xl shadow-md border border-[#E5E5E0] p-8 hover:shadow-lg transition-shadow">
            <h2 className="text-2xl font-serif text-[#222] mb-6 flex items-center gap-3">
              <div className="p-2 bg-[#C19A43]/10 rounded-lg">
                <svg className="w-6 h-6 text-[#C19A43]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="font-bold">Timestamps</span>
            </h2>
            <dl className="grid md:grid-cols-3 gap-4">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-[#C19A43] mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <div>
                  <dt className="text-xs font-semibold text-[#666] uppercase tracking-wide mb-1">Created</dt>
                  <dd className="text-sm text-[#222]">{new Date(submission.created_at).toLocaleString()}</dd>
                </div>
              </div>
              {submission.submitted_at && (
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-green-600 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <dt className="text-xs font-semibold text-[#666] uppercase tracking-wide mb-1">Submitted</dt>
                    <dd className="text-sm text-[#222]">{new Date(submission.submitted_at).toLocaleString()}</dd>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-[#C19A43] mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <div>
                  <dt className="text-xs font-semibold text-[#666] uppercase tracking-wide mb-1">Last Updated</dt>
                  <dd className="text-sm text-[#222]">{new Date(submission.updated_at).toLocaleString()}</dd>
                </div>
              </div>
            </dl>
          </div>

          {/* AI Screening Results */}
          {submission.ai_screenings && submission.ai_screenings.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg border border-[#E5E5E0] p-8 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-serif text-[#222] flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-[#1565C0]/10 to-[#1976D2]/10 rounded-xl">
                    <svg className="w-6 h-6 text-[#1565C0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="font-bold">AI Screening Results</span>
                </h2>
                <ScreeningDetailsModal 
                  submissionId={submission.id}
                  submissionCode={submission.submission_code}
                />
              </div>

              {submission.ai_screenings.map((screening: any) => (
                <div key={screening.id} className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-[#F9F9F7] rounded-lg p-4">
                      <dt className="text-xs font-semibold text-[#666] uppercase tracking-wide mb-2">Status</dt>
                      <dd className="text-lg font-bold text-[#222]">
                        {screening.status === 'PASSED' && <span className="text-green-600">✓ PASSED</span>}
                        {screening.status === 'FAILED' && <span className="text-red-600">✗ FAILED</span>}
                        {screening.status === 'REVIEW' && <span className="text-yellow-600">⚠ REVIEW</span>}
                      </dd>
                    </div>
                    <div className="bg-[#F9F9F7] rounded-lg p-4">
                      <dt className="text-xs font-semibold text-[#666] uppercase tracking-wide mb-2">Phase</dt>
                      <dd className="text-lg font-bold text-[#222]">{screening.phase}</dd>
                    </div>
                    <div className="bg-[#F9F9F7] rounded-lg p-4">
                      <dt className="text-xs font-semibold text-[#666] uppercase tracking-wide mb-2">Screened At</dt>
                      <dd className="text-sm text-[#222]">{new Date(screening.created_at).toLocaleString()}</dd>
                    </div>
                  </div>

                  {screening.model_name && (
                    <div className="bg-[#F9F9F7] rounded-lg p-4">
                      <dt className="text-xs font-semibold text-[#666] uppercase tracking-wide mb-2">Model Info</dt>
                      <dd className="text-sm text-[#222]">
                        {screening.model_name}
                        {screening.prompt_hash && (
                          <span className="ml-2 text-xs text-[#666] font-mono">
                            (Hash: {screening.prompt_hash.substring(0, 8)}...)
                          </span>
                        )}
                      </dd>
                    </div>
                  )}

                  {screening.notes && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                      <dt className="text-xs font-semibold text-yellow-900 uppercase tracking-wide mb-2">Notes</dt>
                      <dd className="text-sm text-yellow-900">{screening.notes}</dd>
                    </div>
                  )}

                  {/* Manual Override Button for REVIEW status */}
                  {screening.status === 'REVIEW' && (
                    <OverrideScreeningButton
                      submissionId={submission.id}
                      screeningId={screening.id}
                      currentStatus={screening.status}
                      onSuccess={() => window.location.reload()}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Admin Actions */}
          <div className="bg-gradient-to-br from-white to-[#F9F9F7] rounded-2xl shadow-lg border-2 border-[#004D40]/20 p-8 hover:shadow-xl transition-all">
            <h2 className="text-2xl font-serif text-[#222] mb-4 flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-[#004D40] to-[#00695C] rounded-xl shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span className="font-bold">Admin Actions</span>
            </h2>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg mb-6">
              <p className="text-sm text-blue-900 flex items-start gap-2">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Update the submission status. This action will be logged in the audit trail.</span>
              </p>
            </div>
            <UpdateStatusButton submissionId={submission.id} currentStatus={submission.status} />
          </div>
        </div>
      </div>
    </div>
  );
}


export default SubmissionDetailPage;
