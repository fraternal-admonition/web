"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import toast from "react-hot-toast";
import { generateSlugFromTitle } from "@/lib/posts/slug";
import { calculateReadingTime } from "@/lib/posts/reading-time";
import { FeaturedPostsWarning } from "@/components/posts/FeaturedPostsWarning";
import type { ReadingTimeMode } from "@/types/posts";

const RichTextEditor = dynamic(() => import("@/components/editor"), {
  ssr: false,
  loading: () => (
    <div className="border border-[#E5E5E0] rounded-lg bg-white p-4 min-h-[400px] flex items-center justify-center">
      <span className="text-[#666]">Loading editor...</span>
    </div>
  ),
});

export default function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [postId, setPostId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [featuredCount, setFeaturedCount] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [formData, setFormData] = useState({
    slug: "",
    title: "",
    content: "",
    published: false,
    featured: false,
    reading_time_mode: "auto" as ReadingTimeMode,
    reading_time_value: 0,
    meta_title: "",
    meta_description: "",
    og_image: "",
    excerpt: "",
  });
  
  const [originalFeatured, setOriginalFeatured] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Unwrap params
  useEffect(() => {
    params.then((p) => setPostId(p.id));
  }, [params]);

  // Fetch post data
  useEffect(() => {
    if (!postId) return;

    const fetchPost = async () => {
      try {
        const response = await fetch(`/api/admin/posts/${postId}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to fetch post");
        }

        const post = result.data;
        
        // Use draft content if available, otherwise use published content
        const content = post.draft_body_rich_json?.content || post.body_rich_json?.content || "";

        setFormData({
          slug: post.slug,
          title: post.title,
          content,
          published: post.published,
          featured: post.featured,
          reading_time_mode: post.reading_time_mode || "auto",
          reading_time_value: post.reading_time_value || 0,
          meta_title: post.meta_title || "",
          meta_description: post.meta_description || "",
          og_image: post.og_image || "",
          excerpt: post.excerpt || "",
        });

        setOriginalFeatured(post.featured);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load post");
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  // Fetch featured posts count
  useEffect(() => {
    const fetchFeaturedCount = async () => {
      try {
        const response = await fetch("/api/admin/posts");
        const result = await response.json();
        if (result.success) {
          const count = result.data.filter((p: any) => p.featured).length;
          setFeaturedCount(count);
        }
      } catch (error) {
        console.error("Failed to fetch featured count:", error);
      }
    };
    fetchFeaturedCount();
  }, []);

  // Auto-save to database every 30 seconds
  useEffect(() => {
    if (!postId || loading) return;

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    if (formData.content && formData.title) {
      autoSaveTimeoutRef.current = setTimeout(() => {
        saveDraft();
      }, 30000);
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [formData, postId, loading]);

  const saveDraft = async () => {
    if (!postId || !formData.title || !formData.content) return;
    
    try {
      const response = await fetch(`/api/admin/posts/${postId}/draft`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          draft_body_rich_json: { content: formData.content },
        }),
      });

      if (response.ok) {
        setLastSaved(new Date());
        toast.success('Draft saved', { duration: 2000 });
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  };

  // Calculate reading time when content changes (if mode is auto)
  useEffect(() => {
    if (formData.reading_time_mode === "auto" && formData.content) {
      const calculatedTime = calculateReadingTime(formData.content);
      setFormData(prev => ({ ...prev, reading_time_value: calculatedTime }));
    }
  }, [formData.content, formData.reading_time_mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postId) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slug: formData.slug,
          title: formData.title,
          content_rich_json: { content: formData.content },
          published: formData.published,
          featured: formData.featured,
          reading_time_mode: formData.reading_time_mode,
          reading_time_value: formData.reading_time_value,
          meta_title: formData.meta_title || null,
          meta_description: formData.meta_description || null,
          og_image: formData.og_image || null,
          excerpt: formData.excerpt || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update post");
      }

      toast.success("Post updated successfully");
      router.push("/admin/posts");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update post");
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!postId) return;

    setDeleting(true);

    try {
      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete post");
      }

      toast.success("Post deleted successfully");
      router.push("/admin/posts");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete post");
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center">
        <div className="text-[#666]">Loading post...</div>
      </div>
    );
  }

  const canFeature = originalFeatured || featuredCount < 3;

  return (
    <div className="min-h-screen bg-[#F9F9F7]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/admin/posts"
              className="text-[#666] hover:text-[#004D40] transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Posts
            </Link>
            {lastSaved && (
              <span className="text-sm text-[#888]">
                Last saved: {lastSaved.toLocaleTimeString()}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-serif text-[#222] mb-2">
              Edit <span className="text-[#004D40]">Post</span>
            </h1>
            <p className="text-[#666]">Update post content and settings</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {formData.featured && (
          <FeaturedPostsWarning
            currentFeaturedCount={featuredCount}
            isCurrentPostFeatured={originalFeatured}
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-[#E5E5E0] p-6">
            {/* Title */}
            <div className="mb-6">
              <label htmlFor="title" className="block text-sm font-medium text-[#222] mb-2">
                Post Title *
              </label>
              <input
                type="text"
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 border border-[#E5E5E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004D40] focus:border-transparent"
                placeholder="Enter post title"
              />
            </div>

            {/* Slug */}
            <div className="mb-6">
              <label htmlFor="slug" className="block text-sm font-medium text-[#222] mb-2">
                URL Slug *
              </label>
              <div className="flex items-center">
                <span className="text-[#666] mr-2">/posts/</span>
                <input
                  type="text"
                  id="slug"
                  required
                  pattern="[a-z0-9-]+"
                  value={formData.slug}
                  onChange={(e) => {
                    setFormData({ ...formData, slug: e.target.value.toLowerCase() });
                    setSlugManuallyEdited(true);
                  }}
                  className="flex-1 px-4 py-3 border border-[#E5E5E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004D40] focus:border-transparent"
                  placeholder="post-url-slug"
                />
              </div>
              <p className="mt-1 text-sm text-[#666]">
                Use lowercase letters, numbers, and hyphens only
              </p>
            </div>

            {/* Content */}
            <div className="mb-6">
              <label htmlFor="content" className="block text-sm font-medium text-[#222] mb-2">
                Content *
              </label>
              <RichTextEditor
                content={formData.content}
                onChange={(html) => setFormData({ ...formData, content: html })}
                placeholder="Start writing your post..."
              />
            </div>

            {/* Publishing Options */}
            <div className="mb-6 pb-6 border-b border-[#E5E5E0]">
              <h3 className="text-lg font-semibold mb-4 text-[#222]">Publishing Options</h3>
              
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.published}
                    onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                    className="w-4 h-4 text-[#004D40] border-[#E5E5E0] rounded focus:ring-[#004D40]"
                  />
                  <span className="text-sm font-medium text-[#222]">Published</span>
                </label>
                
                <div>
                  <label className={`flex items-center space-x-3 ${!canFeature ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      disabled={!canFeature}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                      className="w-4 h-4 text-[#004D40] border-[#E5E5E0] rounded focus:ring-[#004D40] disabled:cursor-not-allowed"
                    />
                    <span className="text-sm font-medium text-[#222]">Mark as featured</span>
                  </label>
                  {!canFeature && (
                    <p className="ml-7 mt-1 text-sm text-amber-600">
                      Maximum of 3 featured posts reached. Please unfeature another post first.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Reading Time Configuration */}
            <div className="mb-6 pb-6 border-b border-[#E5E5E0]">
              <h3 className="text-lg font-semibold mb-4 text-[#222]">Reading Time</h3>
              
              <div className="space-y-3 mb-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="reading_time_mode"
                    value="auto"
                    checked={formData.reading_time_mode === "auto"}
                    onChange={(e) => setFormData({ ...formData, reading_time_mode: e.target.value as ReadingTimeMode })}
                    className="w-4 h-4 text-[#004D40] border-[#E5E5E0] focus:ring-[#004D40]"
                  />
                  <span className="text-sm text-[#222]">
                    Auto-calculate 
                    {formData.reading_time_mode === "auto" && formData.content && (
                      <span className="ml-2 text-[#666]">({formData.reading_time_value} min)</span>
                    )}
                  </span>
                </label>
                
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="reading_time_mode"
                    value="manual"
                    checked={formData.reading_time_mode === "manual"}
                    onChange={(e) => setFormData({ ...formData, reading_time_mode: e.target.value as ReadingTimeMode })}
                    className="w-4 h-4 text-[#004D40] border-[#E5E5E0] focus:ring-[#004D40]"
                  />
                  <span className="text-sm text-[#222]">Manual input</span>
                </label>
                
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="reading_time_mode"
                    value="hidden"
                    checked={formData.reading_time_mode === "hidden"}
                    onChange={(e) => setFormData({ ...formData, reading_time_mode: e.target.value as ReadingTimeMode })}
                    className="w-4 h-4 text-[#004D40] border-[#E5E5E0] focus:ring-[#004D40]"
                  />
                  <span className="text-sm text-[#222]">Don't display</span>
                </label>
              </div>

              {formData.reading_time_mode === "manual" && (
                <div>
                  <label className="block text-sm font-medium text-[#222] mb-2">
                    Reading Time (minutes)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.reading_time_value}
                    onChange={(e) => setFormData({ ...formData, reading_time_value: parseInt(e.target.value) || 0 })}
                    className="w-32 px-4 py-2 border border-[#E5E5E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004D40]"
                  />
                </div>
              )}
            </div>

            {/* SEO Settings */}
            <details className="mb-6">
              <summary className="cursor-pointer text-lg font-semibold text-[#222] mb-4">
                SEO Settings (Optional)
              </summary>
              
              <div className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-[#222] mb-2">
                    Meta Title
                  </label>
                  <input
                    type="text"
                    value={formData.meta_title}
                    onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                    className="w-full px-4 py-2 border border-[#E5E5E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004D40]"
                    placeholder="SEO title (60 characters max)"
                    maxLength={60}
                  />
                  <p className="text-xs text-[#888] mt-1">
                    {formData.meta_title.length}/60 characters
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#222] mb-2">
                    Meta Description
                  </label>
                  <textarea
                    value={formData.meta_description}
                    onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                    className="w-full px-4 py-2 border border-[#E5E5E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004D40]"
                    placeholder="Brief description (160 characters max)"
                    maxLength={160}
                    rows={3}
                  />
                  <p className="text-xs text-[#888] mt-1">
                    {formData.meta_description.length}/160 characters
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#222] mb-2">
                    OG Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.og_image}
                    onChange={(e) => setFormData({ ...formData, og_image: e.target.value })}
                    className="w-full px-4 py-2 border border-[#E5E5E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004D40]"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#222] mb-2">
                    Excerpt
                  </label>
                  <textarea
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    className="w-full px-4 py-2 border border-[#E5E5E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004D40]"
                    placeholder="Brief summary for post listing"
                    rows={3}
                  />
                </div>
              </div>
            </details>
          </div>

          {/* Actions */}
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="px-6 py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium"
            >
              Delete Post
            </button>
            
            <div className="flex space-x-4">
              <Link
                href="/admin/posts"
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
          </div>
        </form>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4">
              <h3 className="text-xl font-semibold text-[#222] mb-4">Delete Post?</h3>
              <p className="text-[#666] mb-6">
                Are you sure you want to delete this post? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="px-4 py-2 border border-[#E5E5E0] rounded-lg text-[#222] hover:bg-[#F9F9F7] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
