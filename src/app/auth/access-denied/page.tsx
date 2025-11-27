import Link from "next/link";

export default function AccessDeniedPage() {
  return (
    <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-sm border border-[#E5E5E0] p-8 text-center">
          {/* Icon */}
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
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
                  d="M12 15v2m0 0v2m0-2h2m-2 0H10m4-6V7a4 4 0 10-8 0v4m12 0a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2h12z"
                />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-serif text-[#222] mb-3">
            Access Denied
          </h1>

          {/* Message */}
          <p className="text-[#666] mb-6">
            This site is currently restricted to administrators only. If you
            believe you should have access, please contact the site
            administrator.
          </p>

          {/* Actions */}
          <div className="space-y-3">
            <form action="/api/auth/signout" method="POST" className="w-full">
              <button
                type="submit"
                className="w-full bg-[#004D40] text-white px-6 py-3 rounded-lg hover:bg-[#00695C] transition-colors font-medium"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
