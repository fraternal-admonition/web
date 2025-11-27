"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeletePageButton({
  pageId,
  pageTitle,
}: {
  pageId: string;
  pageTitle: string;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${pageTitle}"?`)) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/admin/cms/pages/${pageId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete page");
      }

      // Refresh the page to show updated list
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete page");
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
    >
      {isDeleting ? "Deleting..." : "Delete"}
    </button>
  );
}
