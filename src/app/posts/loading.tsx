export default function PostsLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F9F9F7] via-[#FFFFFF] to-[#F9F9F7]">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        {/* Hero Header Skeleton */}
        <div className="text-center mb-16">
          <div className="h-4 w-48 bg-[#E5E5E0] rounded mx-auto mb-6 animate-pulse" />
          <div className="h-12 w-64 bg-[#E5E5E0] rounded mx-auto mb-6 animate-pulse" />
          <div className="h-6 w-96 bg-[#E5E5E0] rounded mx-auto animate-pulse" />
        </div>

        {/* Featured Posts Skeleton */}
        <div className="mb-20">
          <div className="h-8 w-48 bg-[#E5E5E0] rounded mx-auto mb-8 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-lg shadow-sm border border-[#E5E5E0] p-6 animate-pulse"
              >
                <div className="h-6 bg-[#E5E5E0] rounded mb-4" />
                <div className="h-4 bg-[#E5E5E0] rounded mb-2" />
                <div className="h-4 bg-[#E5E5E0] rounded w-3/4 mb-4" />
                <div className="h-3 bg-[#E5E5E0] rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Posts Skeleton */}
        <div>
          <div className="h-8 w-48 bg-[#E5E5E0] rounded mx-auto mb-8 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white rounded-lg shadow-sm border border-[#E5E5E0] p-6 animate-pulse"
              >
                <div className="h-6 bg-[#E5E5E0] rounded mb-4" />
                <div className="h-4 bg-[#E5E5E0] rounded mb-2" />
                <div className="h-4 bg-[#E5E5E0] rounded w-3/4 mb-4" />
                <div className="h-3 bg-[#E5E5E0] rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
