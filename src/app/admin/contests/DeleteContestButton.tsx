"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface DeleteContestButtonProps {
  contestId: string;
  contestTitle: string;
  submissionCount: number;
}

export default function DeleteContestButton({
  contestId,
  contestTitle,
  submissionCount,
}: DeleteContestButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/admin/contests/${contestId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete contest");
      }

      toast.success("Contest deleted successfully");
      router.refresh();
      setShowConfirm(false);
    } catch (error) {
      console.error("Error deleting contest:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete contest"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="text-red-600 hover:text-red-800 transition-colors"
        disabled={isDeleting}
      >
        Delete
      </button>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-[#222] mb-2">
              Delete Contest
            </h3>
            <p className="text-[#666] mb-4">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-[#222]">
                &quot;{contestTitle}&quot;
              </span>
              ?
            </p>

            {submissionCount > 0 && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                <p className="text-sm font-medium">
                  ⚠️ This contest has {submissionCount} submission
                  {submissionCount > 1 ? "s" : ""}
                </p>
                <p className="text-sm mt-1">
                  You cannot delete a contest with submissions. Please remove
                  all submissions first.
                </p>
              </div>
            )}

            {submissionCount === 0 && (
              <p className="text-sm text-[#666] mb-4">
                This action cannot be undone.
              </p>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-[#666] hover:text-[#222] transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting || submissionCount > 0}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  submissionCount > 0
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-red-600 text-white hover:bg-red-700"
                }`}
              >
                {isDeleting ? "Deleting..." : "Delete Contest"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
