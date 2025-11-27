"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import Image from "next/image";
import { Illustration } from "@/types/contests";

interface IllustrationCardProps {
  illustration: Illustration;
  contestId: string;
}

export default function IllustrationCard({
  illustration,
  contestId,
}: IllustrationCardProps) {
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingActive, setIsTogglingActive] = useState(false);

  const handleToggleActive = async () => {
    setIsTogglingActive(true);

    try {
      const response = await fetch(
        `/api/admin/illustrations/${illustration.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            is_active: !illustration.is_active,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update illustration");
      }

      toast.success(
        illustration.is_active
          ? "Illustration deactivated"
          : "Illustration activated"
      );
      router.refresh();
    } catch (error) {
      console.error("Error toggling illustration:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update illustration"
      );
    } finally {
      setIsTogglingActive(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(
        `/api/admin/illustrations/${illustration.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete illustration");
      }

      toast.success("Illustration deleted successfully");
      router.refresh();
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error("Error deleting illustration:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete illustration"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Use the path directly as it's already a full URL
  const imagePath = illustration.asset?.path || "/placeholder-image.png";

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-[#E5E5E0] overflow-hidden hover:shadow-md transition-shadow">
        {/* Image */}
        <div className="relative w-full h-48 bg-[#F9F9F7]">
          <Image
            src={imagePath}
            alt={illustration.title || "Illustration"}
            fill
            className="object-cover"
          />
          {!illustration.is_active && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="bg-gray-800 text-white px-3 py-1 rounded-full text-sm font-medium">
                Inactive
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="text-lg font-medium text-[#222] mb-1">
            {illustration.title || "Untitled"}
          </h3>
          {illustration.description && (
            <p className="text-sm text-[#666] mb-3 line-clamp-2">
              {illustration.description}
            </p>
          )}

          {/* Status Badge */}
          <div className="mb-3">
            <span
              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                illustration.is_active
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {illustration.is_active ? "Active" : "Inactive"}
            </span>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Link
              href={`/admin/contests/${contestId}/illustrations/${illustration.id}/edit`}
              className="w-full px-3 py-2 text-sm text-center border border-[#004D40] text-[#004D40] rounded-lg hover:bg-[#004D40] hover:text-white transition-colors"
            >
              Edit
            </Link>
            <div className="flex gap-2">
              <button
                onClick={handleToggleActive}
                disabled={isTogglingActive}
                className="flex-1 px-3 py-2 text-sm border border-[#E5E5E0] rounded-lg hover:bg-[#F9F9F7] transition-colors disabled:opacity-50"
              >
                {isTogglingActive
                  ? "..."
                  : illustration.is_active
                    ? "Deactivate"
                    : "Activate"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting}
                className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-[#222] mb-2">
              Delete Illustration
            </h3>
            <p className="text-[#666] mb-4">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-[#222]">
                &quot;{illustration.title}&quot;
              </span>
              ?
            </p>
            <p className="text-sm text-[#666] mb-4">
              This action cannot be undone. The illustration cannot be deleted
              if it&apos;s referenced by any submissions.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-[#666] hover:text-[#222] transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete Illustration"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
