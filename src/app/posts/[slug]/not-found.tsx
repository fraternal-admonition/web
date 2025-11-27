import Link from "next/link";

export default function PostNotFound() {
  return (
    <div className="min-h-screen bg-[#F9F9F7] pt-32 pb-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-[#E5E5E0] p-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-[#C19A43]/10 to-[#004D40]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-[#C19A43]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-serif text-[#222] mb-4">404</h1>
          <h2 className="text-2xl font-serif text-[#222] mb-4">Post Not Found</h2>
          <p className="text-[#666] mb-8">
            The post you're looking for doesn't exist or may have been removed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/posts"
              className="px-6 py-3 bg-[#004D40] text-white rounded-lg hover:bg-[#00695C] transition-all shadow-md hover:shadow-lg font-medium"
            >
              View All Posts
            </Link>
            <Link
              href="/"
              className="px-6 py-3 border border-[#E5E5E0] text-[#222] rounded-lg hover:bg-[#F9F9F7] transition-colors font-medium"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
