"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type CMSPage = {
  id: string;
  slug: string;
  title: string;
  content_rich_json: { content: string } | string;
  published: boolean;
  created_at: string;
  updated_at: string;
};

export default function CMSPageView() {
  const params = useParams();
  const slug = params.slug as string;

  const [page, setPage] = useState<CMSPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPage();
  }, [slug]);

  const fetchPage = async () => {
    try {
      const response = await fetch(`/api/cms/pages/${slug}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch page");
      }

      setPage(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Page not found");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F9F7] pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-[#666]">Loading...</div>
        </div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen bg-[#F9F9F7] pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-serif text-[#222] mb-4">
              404 - Page Not Found
            </h1>
            <p className="text-[#666] mb-8">
              The page you're looking for doesn't exist.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-[#004D40] text-white rounded-lg hover:bg-[#00695C] transition-all shadow-md hover:shadow-lg font-medium"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Parse content if it's a string
  let content = "";
  if (typeof page.content_rich_json === "string") {
    try {
      const parsed = JSON.parse(page.content_rich_json);
      content = parsed.content || "";
    } catch {
      content = page.content_rich_json;
    }
  } else {
    content = page.content_rich_json.content || "";
  }

  return (
    <div className="min-h-screen bg-[#F9F9F7] pt-32 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[#666] hover:text-[#004D40] transition-colors mb-6"
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
            Back to Home
          </Link>
          <h1 className="text-4xl md:text-5xl font-serif text-[#222] mb-4">
            {page.title}
          </h1>
          <div className="flex items-center gap-4 text-sm text-[#666]">
            <span>
              Updated: {new Date(page.updated_at).toLocaleDateString()}
            </span>
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
              prose-ol:text-[#444]"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>

        {/* Footer Navigation */}
        <div className="mt-12 text-center">
          <Link
            href="/"
            className="inline-block text-[#666] hover:text-[#004D40] transition-colors font-medium"
          >
            ← Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

