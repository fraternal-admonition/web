"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import toast from "react-hot-toast";
import { AutoSaveManager } from "@/lib/cms/auto-save";

const RichTextEditor = dynamic(() => import("@/components/editor"), {
  ssr: false,
  loading: () => (
    <div className="border border-[#E5E5E0] rounded-lg bg-white p-4 min-h-[400px] flex items-center justify-center">
      <span className="text-[#666]">Loading editor...</span>
    </div>
  ),
});

export default function EditCMSPage() {
  const router = useRouter();
  const params = useParams();
  const pageId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    slug: "",
    title: "",
    content: "",
    published: false,
    meta_title: "",
    meta_description: "",
    og_image: "",
    excerpt: "",
  });
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSaving, setAutoSaving] = useState(false);
  const autoSaveManagerRef = useRef<AutoSaveManager | null>(null);

  // Initialize AutoSaveManager
  useEffect(() => {
    const saveDraft = async (data: any) => {
      setAutoSaving(true);
      try {
        const response = await fetch(`/api/admin/cms/pages/${pageId}/draft`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data.data),
        });
        
        if (response.ok) {
          setLastSaved(new Date());
          toast.success('Draft saved automatically', { duration: 2000 });
        } else {
          throw new Error('Failed to save draft');
        }
      } finally {
        setAutoSaving(false);
      }
    };

    autoSaveManagerRef.current = new AutoSaveManager(saveDraft);

    return () => {
      autoSaveManagerRef.current?.destroy();
    };
  }, [pageId]);

  useEffect(() => {
    fetchPage();
  }, [pageId]);

  const fetchPage = async () => {
    try {
      const response = await fetch(`/api/admin/cms/pages/${pageId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch page");
      }

      setFormData({
        slug: result.data.slug,
        title: result.data.title,
        // Use draft content if available, otherwise use published content
        content: result.data.draft_content_json?.content || result.data.content_rich_json?.content || "",
        published: result.data.published,
        meta_title: result.data.meta_title || "",
        meta_description: result.data.meta_description || "",
        og_image: result.data.og_image || "",
        excerpt: result.data.excerpt || "",
      });
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load page");
      setLoading(false);
    }
  };

  // Auto-save functionality with AutoSaveManager
  useEffect(() => {
    if (formData.content && formData.title && !loading && autoSaveManagerRef.current) {
      autoSaveManagerRef.current.scheduleSave({
        data: {
          draft_content_json: { content: formData.content },
          title: formData.title,
          meta_title: formData.meta_title,
          meta_description: formData.meta_description,
          og_image: formData.og_image,
          excerpt: formData.excerpt,
        },
      });
    }
  }, [formData.content, formData.title, formData.meta_title, formData.meta_description, formData.og_image, formData.excerpt, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Cancel any pending auto-saves
    autoSaveManagerRef.current?.cancelPendingSaves();
    
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/cms/pages/${pageId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slug: formData.slug,
          title: formData.title,
          content_rich_json: { content: formData.content },
          published: formData.published,
          meta_title: formData.meta_title || null,
          meta_description: formData.meta_description || null,
          og_image: formData.og_image || null,
          excerpt: formData.excerpt || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update page");
      }

      router.push("/admin/cms/pages");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update page");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F9F7] flex justify-center items-center">
        <div className="text-[#666]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9F7]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link
              href="/admin/cms/pages"
              className="text-[#666] hover:text-[#004D40] transition-colors flex items-center gap-2"
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
              Back to Pages
            </Link>
          </div>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-serif text-[#222] mb-2">
                Edit <span className="text-[#C19A43]">Page</span>
              </h1>
              <p className="text-[#666]">Update page content and settings</p>
            </div>
            {(lastSaved || autoSaving) && (
              <div className="text-sm text-[#666] flex items-center gap-2">
                {autoSaving ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving draft...
                  </>
                ) : lastSaved ? (
                  <>
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Draft saved {lastSaved.toLocaleTimeString()}
                  </>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-[#E5E5E0] p-6">
            {/* Title */}
            <div className="mb-6">
              <label
                htmlFor="title"
                className="block text-sm font-medium text-[#222] mb-2"
              >
                Page Title *
              </label>
              <input
                type="text"
                id="title"
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-4 py-3 border border-[#E5E5E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004D40] focus:border-transparent"
                placeholder="About Us"
              />
            </div>

            {/* Slug */}
            <div className="mb-6">
              <label
                htmlFor="slug"
                className="block text-sm font-medium text-[#222] mb-2"
              >
                URL Slug *
              </label>
              <div className="flex items-center">
                <span className="text-[#666] mr-2">/</span>
                <input
                  type="text"
                  id="slug"
                  required
                  pattern="[a-z0-9-]+"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      slug: e.target.value.toLowerCase(),
                    })
                  }
                  className="flex-1 px-4 py-3 border border-[#E5E5E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004D40] focus:border-transparent"
                  placeholder="about-us"
                />
              </div>
              <p className="mt-1 text-sm text-[#666]">
                Use lowercase letters, numbers, and hyphens only
              </p>
            </div>

            {/* Content */}
            <div className="mb-6">
              <label
                htmlFor="content"
                className="block text-sm font-medium text-[#222] mb-2"
              >
                Content *
              </label>
              <RichTextEditor
                content={formData.content}
                onChange={(html) =>
                  setFormData({ ...formData, content: html })
                }
                placeholder="Start writing your page content..."
              />
              <p className="mt-2 text-sm text-[#666]">
                Use the toolbar above to format your content with headings, lists, links, images, tables, and more.
              </p>
            </div>

            {/* SEO Settings */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4 text-[#222]">SEO Settings</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-[#222] mb-2">
                  Meta Title (for search engines)
                </label>
                <input
                  type="text"
                  value={formData.meta_title}
                  onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                  className="w-full px-4 py-2 border border-[#E5E5E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004D40]"
                  placeholder="Page title for SEO (60 characters max)"
                  maxLength={60}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.meta_title.length}/60 characters
                </p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-[#222] mb-2">
                  Meta Description (for search engines)
                </label>
                <textarea
                  value={formData.meta_description}
                  onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                  className="w-full px-4 py-2 border border-[#E5E5E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004D40]"
                  placeholder="Brief description for search results (160 characters max)"
                  maxLength={160}
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.meta_description.length}/160 characters
                </p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-[#222] mb-2">
                  OG Image URL (for social media)
                </label>
                <input
                  type="url"
                  value={formData.og_image}
                  onChange={(e) => setFormData({ ...formData, og_image: e.target.value })}
                  className="w-full px-4 py-2 border border-[#E5E5E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004D40]"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-[#222] mb-2">
                  Excerpt (page summary)
                </label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  className="w-full px-4 py-2 border border-[#E5E5E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004D40]"
                  placeholder="Brief summary of the page content"
                  rows={3}
                />
              </div>
            </div>

            {/* Published */}
            <div className="mb-6">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.published}
                  onChange={(e) =>
                    setFormData({ ...formData, published: e.target.checked })
                  }
                  className="w-4 h-4 text-[#004D40] border-[#E5E5E0] rounded focus:ring-[#004D40]"
                />
                <span className="text-sm font-medium text-[#222]">
                  Published
                </span>
              </label>
              <p className="ml-7 text-sm text-[#666]">
                Unpublished pages are saved as drafts
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Link
              href="/admin/cms/pages"
              className="px-6 py-3 border border-[#E5E5E0] rounded-lg text-[#222] hover:bg-[#F9F9F7] transition-colors font-medium"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-[#004D40] text-white rounded-lg hover:bg-[#00695C] transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
