export default function AdminPostsLoading() {
  return (
    <div className="min-h-screen bg-[#F9F9F7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="h-10 w-64 bg-[#E5E5E0] rounded mb-2 animate-pulse" />
          <div className="h-4 w-96 bg-[#E5E5E0] rounded animate-pulse" />
        </div>

        {/* Action Button Skeleton */}
        <div className="mb-6">
          <div className="h-12 w-48 bg-[#E5E5E0] rounded animate-pulse" />
        </div>

        {/* Table Skeleton */}
        <div className="bg-white rounded-lg shadow-sm border border-[#E5E5E0] overflow-hidden">
          <div className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 py-4 border-b border-[#E5E5E0]">
                  <div className="flex-1">
                    <div className="h-5 bg-[#E5E5E0] rounded mb-2 animate-pulse" />
                    <div className="h-3 bg-[#E5E5E0] rounded w-1/2 animate-pulse" />
                  </div>
                  <div className="h-6 w-20 bg-[#E5E5E0] rounded animate-pulse" />
                  <div className="h-8 w-24 bg-[#E5E5E0] rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
