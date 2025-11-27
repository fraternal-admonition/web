import Link from "next/link";
import type { PostListItem } from "@/types/posts";
import { ReadingTimeDisplay } from "./ReadingTimeDisplay";

interface PostCardProps {
  post: PostListItem;
  featured?: boolean;
  variant?: "default" | "subtle";
}

export function PostCard({ post, featured = false, variant = "default" }: PostCardProps) {
  // Truncate excerpt to reasonable length
  const truncatedExcerpt = post.excerpt
    ? post.excerpt.length > 150
      ? post.excerpt.substring(0, 150) + "..."
      : post.excerpt
    : "";

  // Format published date
  const publishedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  // Subtle variant for "All Posts" page - just a small indicator
  if (featured && variant === "subtle") {
    return (
      <Link
        href={`/posts/${post.slug}`}
        className="flex flex-col h-full group bg-white rounded-lg shadow-sm hover:shadow-md transition-all p-5 border-l-4 border-l-[#C19A43] border-t border-r border-b border-[#E5E5E0] hover:border-[#004D40]/20"
      >
        {/* Small featured indicator */}
        <div className="flex items-center gap-1.5 mb-2">
          <svg
            className="w-3.5 h-3.5 text-[#C19A43]"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="text-xs font-medium text-[#C19A43]">Featured</span>
        </div>

        {/* Title - Fixed to 2 lines */}
        <h3 className="font-serif text-xl text-[#222] group-hover:text-[#004D40] transition-colors mb-2 line-clamp-2 min-h-[3rem]">
          {post.title}
        </h3>

        {/* Excerpt - Fixed to 2 lines */}
        <div className="flex-1 mb-3">
          {truncatedExcerpt && (
            <p className="text-[#666] line-clamp-2 min-h-[3rem]">{truncatedExcerpt}</p>
          )}
        </div>

        {/* Meta information - pushed to bottom */}
        <div className="flex items-center gap-3 text-sm text-[#888] mt-3 pt-3 border-t border-[#E5E5E0]">
          {publishedDate && <span>{publishedDate}</span>}
          {publishedDate && post.reading_time_mode !== "hidden" && (
            <span>•</span>
          )}
          <ReadingTimeDisplay
            mode={post.reading_time_mode}
            value={post.reading_time_value}
          />
        </div>
      </Link>
    );
  }

  // Default featured variant for main posts page
  if (featured) {
    return (
      <Link
        href={`/posts/${post.slug}`}
        className="flex flex-col h-full group bg-white rounded-lg shadow-md hover:shadow-xl transition-all overflow-hidden border border-[#E5E5E0] hover:border-[#C19A43]"
      >
        {/* Gold accent bar at top */}
        <div className="h-1.5 bg-gradient-to-r from-[#C19A43] to-[#D4AF37]"></div>
        
        <div className="flex flex-col flex-1 p-6">
          {/* Featured badge */}
          <div className="flex items-center gap-2 mb-3">
            <svg
              className="w-4 h-4 text-[#C19A43]"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-xs font-semibold text-[#C19A43] uppercase tracking-wide">
              Featured
            </span>
          </div>

          {/* Title - Fixed to 2 lines */}
          <h3 className="font-serif text-2xl text-[#222] group-hover:text-[#004D40] transition-colors mb-3 leading-tight line-clamp-2 min-h-[3.5rem]">
            {post.title}
          </h3>

          {/* Excerpt - Fixed to 3 lines */}
          <div className="flex-1 mb-4">
            {truncatedExcerpt && (
              <p className="text-[#666] line-clamp-3 leading-relaxed min-h-[4.5rem]">
                {truncatedExcerpt}
              </p>
            )}
          </div>

          {/* Meta information - pushed to bottom */}
          <div className="flex items-center gap-3 text-sm text-[#888] pt-4 mt-4 border-t border-[#E5E5E0]">
            {publishedDate && <span>{publishedDate}</span>}
            {publishedDate && post.reading_time_mode !== "hidden" && (
              <span>•</span>
            )}
            <ReadingTimeDisplay
              mode={post.reading_time_mode}
              value={post.reading_time_value}
            />
          </div>
        </div>
      </Link>
    );
  }

  // Regular post card
  return (
    <Link
      href={`/posts/${post.slug}`}
      className="flex flex-col h-full group bg-white rounded-lg shadow-sm hover:shadow-md transition-all p-5 border border-[#E5E5E0] hover:border-[#004D40]/20"
    >
      {/* Title - Fixed to 2 lines */}
      <h3 className="font-serif text-xl text-[#222] group-hover:text-[#004D40] transition-colors mb-2 line-clamp-2 min-h-[3rem]">
        {post.title}
      </h3>

      {/* Excerpt - Fixed to 2 lines */}
      <div className="flex-1 mb-3">
        {truncatedExcerpt && (
          <p className="text-[#666] line-clamp-2 min-h-[3rem]">{truncatedExcerpt}</p>
        )}
      </div>

      {/* Meta information - pushed to bottom */}
      <div className="flex items-center gap-3 text-sm text-[#888] mt-3 pt-3 border-t border-[#E5E5E0]">
        {publishedDate && <span>{publishedDate}</span>}
        {publishedDate && post.reading_time_mode !== "hidden" && (
          <span>•</span>
        )}
        <ReadingTimeDisplay
          mode={post.reading_time_mode}
          value={post.reading_time_value}
        />
      </div>
    </Link>
  );
}
