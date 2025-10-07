import Link from "next/link";

export default function AuthErrorPage() {
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>

        <h2 className="text-2xl font-serif text-[#222] mb-4">
          Authentication Error
        </h2>

        <p className="text-[#666] leading-relaxed mb-6">
          There was a problem verifying your email. The verification link may
          have expired or is invalid.
        </p>

        <div className="space-y-3">
          <Link
            href="/auth/signup"
            className="block w-full bg-[#004D40] text-white py-3 rounded-lg font-semibold hover:bg-[#00695C] transition-colors"
          >
            Try Signing Up Again
          </Link>

          <Link
            href="/auth/signin"
            className="block w-full border border-[#E5E5E0] text-[#222] py-3 rounded-lg font-semibold hover:bg-[#F9F9F7] transition-colors"
          >
            Sign In
          </Link>

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
