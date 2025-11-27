interface FeaturedPostsWarningProps {
  currentFeaturedCount: number;
  isCurrentPostFeatured: boolean;
}

export function FeaturedPostsWarning({
  currentFeaturedCount,
  isCurrentPostFeatured,
}: FeaturedPostsWarningProps) {
  // Calculate the effective count
  const effectiveCount = isCurrentPostFeatured
    ? currentFeaturedCount
    : currentFeaturedCount + 1;

  // Only show warning if more than 3 posts will be featured
  if (effectiveCount <= 3) {
    return null;
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <svg
          className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-amber-900 mb-1">
            Too Many Featured Posts
          </h4>
          <p className="text-sm text-amber-800">
            You currently have {currentFeaturedCount} featured post
            {currentFeaturedCount !== 1 ? "s" : ""}. Only the 3 most recently
            published featured posts will be displayed on the posts page.
            Consider unfeaturing older posts to ensure the right content is
            highlighted.
          </p>
        </div>
      </div>
    </div>
  );
}
