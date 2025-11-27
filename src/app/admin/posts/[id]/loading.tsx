export default function EditPostLoading() {
  return (
    <div className="min-h-screen bg-[#F9F9F7]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="h-4 w-32 bg-[#E5E5E0] rounded mb-4 animate-pulse" />
          <div className="h-10 w-64 bg-[#E5E5E0] rounded mb-2 animate-pulse" />
          <div className="h-4 w-96 bg-[#E5E5E0] rounded animate-pulse" />
        </div>

        {/* Form Skeleton */}
        <div className="bg-white rounded-lg shadow-sm border border-[#E5E5E0] p-6">
          <div className="space-y-6">
            <div>
              <div className="h-4 w-24 bg-[#E5E5E0] rounded mb-2 animate-pulse" />
              <div className="h-12 bg-[#E5E5E0] rounded animate-pulse" />
            </div>
            <div>
              <div className="h-4 w-24 bg-[#E5E5E0] rounded mb-2 animate-pulse" />
              <div className="h-12 bg-[#E5E5E0] rounded animate-pulse" />
            </div>
            <div>
              <div className="h-4 w-24 bg-[#E5E5E0] rounded mb-2 animate-pulse" />
              <div className="h-64 bg-[#E5E5E0] rounded animate-pulse" />
            </div>
          </div>
        </div>

        {/* Actions Skeleton */}
        <div className="flex justify-between mt-6">
          <div className="h-12 w-32 bg-[#E5E5E0] rounded animate-pulse" />
          <div className="flex gap-4">
            <div className="h-12 w-24 bg-[#E5E5E0] rounded animate-pulse" />
            <div className="h-12 w-32 bg-[#E5E5E0] rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
