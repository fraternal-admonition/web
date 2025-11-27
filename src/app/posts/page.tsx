import { Metadata } from "next";
import Link from "next/link";
import { PostCard } from "@/components/posts/PostCard";
import type { PostListItem } from "@/types/posts";

export const metadata: Metadata = {
  title: "Posts | Fraternal Admonition",
  description: "Read the latest updates and announcements from Fraternal Admonition",
};

async function getFeaturedPosts(): Promise<PostListItem[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/posts?featured=true`, {
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Failed to fetch featured posts:", response.statusText);
      return [];
    }

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error("Error fetching featured posts:", error);
    return [];
  }
}

async function getAllPosts(): Promise<PostListItem[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/posts?limit=20`, {
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Failed to fetch posts:", response.statusText);
      return [];
    }

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error("Error fetching posts:", error);
    return [];
  }
}

export default async function PostsPage() {
  const [featuredPosts, allPosts] = await Promise.all([
    getFeaturedPosts(),
    getAllPosts(),
  ]);

  const hasPosts = allPosts.length > 0;
  const hasFeaturedPosts = featuredPosts.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F9F9F7] via-[#FFFFFF] to-[#F9F9F7]">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-40 right-20 w-96 h-96 rounded-full bg-gradient-to-br from-[#C19A43]/5 to-transparent blur-3xl animate-pulse" />
        <div className="absolute bottom-40 left-20 w-80 h-80 rounded-full bg-gradient-to-tr from-[#004D40]/5 to-transparent blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

        {/* Decorative Grid */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.02]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="posts-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#222" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#posts-grid)" />
        </svg>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        {/* Hero Header */}
        <div className="text-center mb-16">
          <p className="text-sm tracking-[0.3em] uppercase text-[#C19A43] mb-6 font-light">
            Updates & Insights
          </p>
          <h1 className="text-5xl md:text-6xl font-serif text-[#222] mb-6">
            Posts
          </h1>
          <p className="text-xl text-[#666] max-w-2xl mx-auto leading-relaxed">
            Thoughts, announcements, and reflections on fraternal admonition and moral clarity
          </p>
        </div>

        {/* Empty State */}
        {!hasPosts && (
          <div className="max-w-md mx-auto">
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
                    d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-serif text-[#222] mb-2">No posts yet</h3>
              <p className="text-[#666] mb-6">
                Check back soon for updates and insights
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-[#004D40] hover:text-[#00695C] font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Return to Home
              </Link>
            </div>
          </div>
        )}

        {/* Featured Posts Section */}
        {hasFeaturedPosts && (
          <div className="mb-20">
            <div className="flex items-center gap-4 mb-8">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#C19A43]/30 to-transparent" />
              <h2 className="text-2xl font-serif text-[#222] flex items-center gap-2">
                <svg className="w-5 h-5 text-[#C19A43]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Featured Posts
              </h2>
              <div className="flex-1 h-px bg-gradient-to-r from-[#C19A43]/30 via-transparent to-transparent" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredPosts.map((post) => (
                <PostCard key={post.id} post={post} featured={true} />
              ))}
            </div>
          </div>
        )}

        {/* Recent Posts Section */}
        {hasPosts && (
          <div>
            <div className="flex items-center gap-4 mb-8">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#E5E5E0] to-transparent" />
              <h2 className="text-2xl font-serif text-[#222]">Recent Posts</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-[#E5E5E0] via-transparent to-transparent" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {allPosts.slice(0, 6).map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>

            {/* View All Posts Button */}
            {allPosts.length > 6 && (
              <div className="text-center">
                <Link
                  href="/posts/all"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#004D40] to-[#00695C] text-white rounded-full hover:shadow-xl transition-all duration-300 font-medium group"
                >
                  <span>View All Posts</span>
                  <svg
                    className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
