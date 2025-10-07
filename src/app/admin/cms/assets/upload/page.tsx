"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function UploadAssetPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    path: "",
    alt: "",
    kind: "image",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/cms/assets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          path: formData.path,
          alt: formData.alt,
          kind: formData.kind,
          meta: {},
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create asset");
      }

      router.push("/admin/cms/assets");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create asset");
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Link
            href="/admin/cms/assets"
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back to Assets
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Upload Asset</h1>
        <p className="mt-2 text-gray-600">
          Add a new image or media file to your site
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {/* Asset Type */}
          <div className="mb-6">
            <label
              htmlFor="kind"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Asset Type *
            </label>
            <select
              id="kind"
              value={formData.kind}
              onChange={(e) =>
                setFormData({ ...formData, kind: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="image">Image</option>
              <option value="video">Video</option>
              <option value="document">Document</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Path/URL */}
          <div className="mb-6">
            <label
              htmlFor="path"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              File URL *
            </label>
            <input
              type="url"
              id="path"
              required
              value={formData.path}
              onChange={(e) =>
                setFormData({ ...formData, path: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://example.com/image.jpg"
            />
            <p className="mt-1 text-sm text-gray-500">
              Enter the full URL of the asset. For now, upload files to Supabase
              Storage or use external URLs.
            </p>
          </div>

          {/* Alt Text */}
          <div className="mb-6">
            <label
              htmlFor="alt"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Alt Text / Description
            </label>
            <input
              type="text"
              id="alt"
              value={formData.alt}
              onChange={(e) =>
                setFormData({ ...formData, alt: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Descriptive text for accessibility"
            />
            <p className="mt-1 text-sm text-gray-500">
              Important for accessibility and SEO
            </p>
          </div>

          {/* Preview */}
          {formData.path && formData.kind === "image" && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preview
              </label>
              <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                <img
                  src={formData.path}
                  alt={formData.alt || "Preview"}
                  className="max-w-full h-auto max-h-64 mx-auto"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <Link
            href="/admin/cms/assets"
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Uploading..." : "Upload Asset"}
          </button>
        </div>
      </form>
    </div>
  );
}
