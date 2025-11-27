"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface UpdateStatusButtonProps {
  submissionId: string;
  currentStatus: string;
}

export default function UpdateStatusButton({
  submissionId,
  currentStatus,
}: UpdateStatusButtonProps) {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const statuses = [
    { value: "PENDING_PAYMENT", label: "Pending Payment" },
    { value: "SUBMITTED", label: "Submitted" },
    { value: "DISQUALIFIED", label: "Disqualified" },
    { value: "FINALIST", label: "Finalist" },
    { value: "WINNER", label: "Winner" },
  ];

  const handleUpdate = async () => {
    if (selectedStatus === currentStatus) {
      setError("Please select a different status");
      return;
    }

    if (!confirm(`Are you sure you want to change the status to "${selectedStatus.replace(/_/g, " ")}"?`)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const response = await fetch(`/api/admin/submissions/${submissionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: selectedStatus,
          old_status: currentStatus,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update status");
      }

      setSuccess(true);
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          disabled={loading}
          className="flex-1 px-4 py-2 border border-[#E5E5E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004D40] focus:border-transparent disabled:opacity-50"
        >
          {statuses.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
        <button
          onClick={handleUpdate}
          disabled={loading || selectedStatus === currentStatus}
          className="px-6 py-2 bg-[#004D40] text-white rounded-lg hover:bg-[#00695C] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Updating..." : "Update Status"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          Status updated successfully! Refreshing...
        </div>
      )}

      {selectedStatus === "SUBMITTED" && currentStatus === "PENDING_PAYMENT" && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm">
          <strong>Note:</strong> Manually marking as SUBMITTED will set the submitted_at timestamp but will not send a confirmation email or create a payment record.
        </div>
      )}
    </div>
  );
}
