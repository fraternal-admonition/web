import { Metadata } from "next";
import Link from "next/link";
import { PostCard } from "@/components/posts/PostCard";
import type { PostListItem } from "@/types/posts";

export const metadata: Metadata = {
  title: "All Posts | Fraternal Admonition",
  description: "Browse all posts from Fraternal Admonition",
};

async function getAllPosts(): Promise<PostListItem[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/posts?limit=100`, {
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Failed to fetch posts:", response.statusText);
      return [];
    }

    const result = await response.json();
    const posts = result.data || [];
    
    // Sort posts: featured first, then by published date
    return posts.sort((a: PostListItem, b: PostListItem) => {
      // Featured posts come first
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      
      // Within same featured status, sort by date
      const dateA = new Date(a.published_at || 0).getTime();
      const dateB = new Date(b.published_at || 0).getTime();
      return dateB - dateA;
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return [];
  }
}

export default async function AllPostsPage() {
  const allPosts = await getAllPosts();
  const hasPosts = allPosts.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F9F9F7] via-[#FFFFFF] to-[#F9F9F7]">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-40 left-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-[#C19A43]/5 to-transparent blur-3xl animate-pulse" />
        <div className="absolute bottom-40 right-1/4 w-80 h-80 rounded-full bg-gradient-to-tr from-[#004D40]/5 to-transparent blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
        
        {/* Decorative Grid */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.02]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="all-posts-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#222" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#all-posts-grid)" />
        </svg>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        {/* Back Navigation */}
        <div className="mb-8">
          <Link
            href="/posts"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-[#E5E5E0] text-[#666] hover:text-[#004D40] hover:border-[#004D40]/30 transition-all"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span className="font-medium">Back to Posts</span>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-sm tracking-[0.3em] uppercase text-[#C19A43] mb-6 font-light">
            Complete Archive
          </p>
          <h1 className="text-5xl md:text-6xl font-serif text-[#222] mb-6">
            All Posts
          </h1>
          <p className="text-xl text-[#666]">
            {allPosts.length} post{allPosts.length !== 1 ? "s" : ""}
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
                Check back soon for updates
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

        {/* All Posts Grid */}
        {hasPosts && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allPosts.map((post) => (
              <PostCard 
                key={post.id} 
                post={post} 
                featured={post.featured}
                variant="subtle"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
