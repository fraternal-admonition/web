"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Image from "next/image";

interface IllustrationFormProps {
  contestId: string;
  illustration?: {
    id: string;
    title: string | null;
    description: string | null;
    asset_id: string | null;
    is_active: boolean;
    asset?: {
      path: string;
      alt: string | null;
    };
  };
  mode: "create" | "edit";
}

export default function IllustrationForm({
  contestId,
  illustration,
  mode,
}: IllustrationFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Form state - initialize with illustration data if in edit mode
  const [title, setTitle] = useState(illustration?.title || "");
  const [description, setDescription] = useState(illustration?.description || "");
  const [assetId, setAssetId] = useState(illustration?.asset_id || "");
  const [imagePreview, setImagePreview] = useState(
    illustration?.asset?.path
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/cms-assets/${illustration.asset.path}`
      : ""
  );
  const [isActive, setIsActive] = useState(illustration?.is_active ?? true);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!assetId) {
      newErrors.image = "Please upload an image";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/cms/upload-image", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload image");
      }

      // API returns { url, assetId, path }
      setAssetId(data.assetId);
      setImagePreview(data.url);
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload image"
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the validation errors");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        asset_id: assetId,
        is_active: isActive,
      };

      const url =
        mode === "create"
          ? `/api/admin/contests/${contestId}/illustrations`
          : `/api/admin/illustrations/${illustration?.id}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            `Failed to ${mode === "create" ? "create" : "update"} illustration`
        );
      }

      toast.success(
        `Illustration ${mode === "create" ? "created" : "updated"} successfully`
      );
      router.push(`/admin/contests/${contestId}/illustrations`);
      router.refresh();
    } catch (error) {
      console.error(`Error ${mode}ing illustration:`, error);
      toast.error(
        error instanceof Error
          ? error.message
          : `Failed to ${mode === "create" ? "create" : "update"} illustration`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-[#E5E5E0] p-6">
        <h2 className="text-xl font-serif text-[#222] mb-4">
          Illustration <span className="text-[#C19A43]">Details</span>
        </h2>

        <div className="space-y-4">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-[#222] mb-1">
              Image <span className="text-red-600">*</span>
            </label>

            {imagePreview ? (
              <div className="space-y-2">
                <div className="relative w-full h-64 rounded-lg overflow-hidden border border-[#E5E5E0]">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAssetId("");
                    setImagePreview("");
                  }}
                  className="text-sm text-red-600 hover:text-red-800 transition-colors"
                >
                  Remove Image
                </button>
              </div>
            ) : (
              <div>
                <label
                  htmlFor="image-upload"
                  className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer hover:bg-[#F9F9F7] transition-colors ${
                    errors.image ? "border-red-500" : "border-[#E5E5E0]"
                  }`}
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg
                      className="w-10 h-10 mb-3 text-[#666]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <p className="mb-2 text-sm text-[#666]">
                      <span className="font-semibold">Click to upload</span> or
                      drag and drop
                    </p>
                    <p className="text-xs text-[#666]">
                      PNG, JPG, WebP (MAX. 5MB)
                    </p>
                  </div>
                  <input
                    id="image-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                  />
                </label>
                {isUploading && (
                  <p className="mt-2 text-sm text-[#666]">Uploading...</p>
                )}
                {errors.image && (
                  <p className="mt-1 text-sm text-red-600">{errors.image}</p>
                )}
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-[#222] mb-1"
            >
              Title <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#004D40] focus:border-transparent ${
                errors.title ? "border-red-500" : "border-[#E5E5E0]"
              }`}
              placeholder="David and Goliath"
            />
            <p className="mt-1 text-sm text-[#666]">
              Must be unique within this contest
            </p>
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-[#222] mb-1"
            >
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-[#E5E5E0] rounded-lg focus:ring-2 focus:ring-[#004D40] focus:border-transparent"
              placeholder="Optional description of the illustration"
              maxLength={1000}
            />
            <p className="mt-1 text-sm text-[#666]">
              {description.length}/1000 characters
            </p>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-[#004D40] border-[#E5E5E0] rounded focus:ring-[#004D40]"
            />
            <label htmlFor="isActive" className="ml-2 text-sm text-[#222]">
              Active (visible in submission form)
            </label>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 text-[#666] hover:text-[#222] transition-colors"
          disabled={isSubmitting || isUploading}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || isUploading}
          className="bg-[#004D40] text-white px-6 py-3 rounded-lg hover:bg-[#00695C] transition-all shadow-md hover:shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting
            ? mode === "create"
              ? "Creating..."
              : "Updating..."
            : mode === "create"
              ? "Create Illustration"
              : "Update Illustration"}
        </button>
      </div>
    </form>
  );
}
