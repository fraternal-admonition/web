import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReadingTimeDisplay } from "@/components/posts/ReadingTimeDisplay";
import type { PostPublic } from "@/types/posts";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getPost(slug: string): Promise<PostPublic | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/posts/${slug}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error("Error fetching post:", error);
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return {
      title: "Post Not Found | Fraternal Admonition",
    };
  }

  const metaTitle = post.meta_title || post.title;
  const metaDescription =
    post.meta_description ||
    post.excerpt ||
    `Read ${post.title} on Fraternal Admonition`;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const postUrl = `${baseUrl}/posts/${slug}`;

  return {
    title: `${metaTitle} | Fraternal Admonition`,
    description: metaDescription,
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      type: "article",
      url: postUrl,
      publishedTime: post.published_at,
      images: post.og_image ? [{ url: post.og_image }] : [],
      siteName: "Fraternal Admonition",
    },
    twitter: {
      card: "summary_large_image",
      title: metaTitle,
      description: metaDescription,
      images: post.og_image ? [post.og_image] : [],
    },
    alternates: {
      canonical: postUrl,
    },
  };
}

export default async function PostDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  // Parse content
  let content = "";
  if (typeof post.body_rich_json === "string") {
    try {
      const parsed = JSON.parse(post.body_rich_json);
      content = parsed.content || "";
    } catch {
      content = post.body_rich_json;
    }
  } else {
    content = post.body_rich_json.content || "";
  }

  // Format published date
  const publishedDate = new Date(post.published_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#F9F9F7] pt-32 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Navigation */}
        <div className="mb-8">
          <Link
            href="/posts"
            className="inline-flex items-center gap-2 text-[#666] hover:text-[#004D40] transition-colors"
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
            Back to Posts
          </Link>
        </div>

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-serif text-[#222] mb-4">
            {post.title}
          </h1>
          <div className="flex items-center gap-4 text-sm text-[#666]">
            <span>{publishedDate}</span>
            {post.reading_time_mode !== "hidden" && (
              <>
                <span>•</span>
                <ReadingTimeDisplay
                  mode={post.reading_time_mode}
                  value={post.reading_time_value}
                />
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border border-[#E5E5E0] p-8 md:p-12">
          <div
            className="prose prose-lg max-w-none
              prose-headings:font-serif prose-headings:text-[#222]
              prose-p:text-[#444] prose-p:leading-relaxed
              prose-a:text-[#004D40] prose-a:no-underline hover:prose-a:text-[#C19A43]
              prose-strong:text-[#222]
              prose-ul:text-[#444]
              prose-ol:text-[#444]
              prose-blockquote:border-l-[#C19A43]
              prose-code:text-[#004D40] prose-code:bg-[#F9F9F7]
              prose-pre:bg-[#222] prose-pre:text-[#F9F9F7]
              prose-img:rounded-lg"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>

        {/* Footer Navigation */}
        <div className="mt-12 text-center">
          <Link
            href="/posts"
            className="inline-block text-[#666] hover:text-[#004D40] transition-colors font-medium"
          >
            ← Return to Posts
          </Link>
        </div>
      </div>
    </div>
  );
}
