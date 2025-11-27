export default function PostDetailLoading() {
  return (
    <div className="min-h-screen bg-[#F9F9F7] pt-32 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Navigation Skeleton */}
        <div className="mb-8">
          <div className="h-4 w-32 bg-[#E5E5E0] rounded animate-pulse" />
        </div>

        {/* Header Skeleton */}
        <div className="mb-12">
          <div className="h-12 bg-[#E5E5E0] rounded mb-4 animate-pulse" />
          <div className="h-12 bg-[#E5E5E0] rounded w-3/4 mb-4 animate-pulse" />
          <div className="flex items-center gap-4">
            <div className="h-4 w-32 bg-[#E5E5E0] rounded animate-pulse" />
            <div className="h-4 w-4 bg-[#E5E5E0] rounded-full animate-pulse" />
            <div className="h-4 w-24 bg-[#E5E5E0] rounded animate-pulse" />
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="bg-white rounded-lg shadow-sm border border-[#E5E5E0] p-8 md:p-12">
          <div className="space-y-4">
            <div className="h-4 bg-[#E5E5E0] rounded animate-pulse" />
            <div className="h-4 bg-[#E5E5E0] rounded animate-pulse" />
            <div className="h-4 bg-[#E5E5E0] rounded w-5/6 animate-pulse" />
            <div className="h-8 bg-[#E5E5E0] rounded w-1/2 mt-8 animate-pulse" />
            <div className="h-4 bg-[#E5E5E0] rounded animate-pulse" />
            <div className="h-4 bg-[#E5E5E0] rounded animate-pulse" />
            <div className="h-4 bg-[#E5E5E0] rounded w-4/5 animate-pulse" />
            <div className="h-4 bg-[#E5E5E0] rounded animate-pulse" />
            <div className="h-4 bg-[#E5E5E0] rounded w-3/4 animate-pulse" />
          </div>
        </div>

        {/* Footer Navigation Skeleton */}
        <div className="mt-12 text-center">
          <div className="h-4 w-32 bg-[#E5E5E0] rounded mx-auto animate-pulse" />
        </div>
      </div>
    </div>
  );
}
