"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function PostDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Post detail error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#F9F9F7] pt-32 pb-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-[#E5E5E0] p-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-red-600"
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
          <h2 className="text-2xl font-serif text-[#222] mb-4">
            Failed to load post
          </h2>
          <p className="text-[#666] mb-8">
            We encountered an error while loading this post. The post may not exist or there was a problem fetching it.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={reset}
              className="px-6 py-3 bg-[#004D40] text-white rounded-lg hover:bg-[#00695C] transition-all shadow-md hover:shadow-lg font-medium"
            >
              Try Again
            </button>
            <Link
              href="/posts"
              className="px-6 py-3 border border-[#E5E5E0] text-[#222] rounded-lg hover:bg-[#F9F9F7] transition-colors font-medium"
            >
              Back to Posts
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
