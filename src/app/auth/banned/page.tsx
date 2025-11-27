import Link from "next/link";

export default function BannedPage() {
  return (
    <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-[#E5E5E0] rounded-lg p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
        </div>

        <h2 className="text-2xl font-serif text-[#222] mb-4">
          Account Suspended
        </h2>

        <p className="text-[#666] leading-relaxed mb-6">
          Your account has been suspended. If you believe this is an error,
          please contact our support team.
        </p>

        <div className="space-y-3">
          <a
            href="mailto:support@fraternaladmonition.com"
            className="block w-full bg-[#004D40] text-white py-3 rounded-lg font-semibold hover:bg-[#00695C] transition-colors"
          >
            Contact Support
          </a>

          <Link
            href="/"
            className="block text-sm text-[#666] hover:text-[#004D40] underline pt-4"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
