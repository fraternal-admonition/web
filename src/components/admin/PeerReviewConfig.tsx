"use client";

import { useState } from "react";

interface PeerReviewConfigProps {
  contestId: string;
  initialDeadlineDays: number;
  initialFinalistCount: number;
  initialResultsVisible: boolean;
}

export default function PeerReviewConfig({
  contestId,
  initialDeadlineDays,
  initialFinalistCount,
  initialResultsVisible,
}: PeerReviewConfigProps) {
  const [deadlineDays, setDeadlineDays] = useState(initialDeadlineDays);
  const [finalistCount, setFinalistCount] = useState(initialFinalistCount);
  const [resultsVisible, setResultsVisible] = useState(initialResultsVisible);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSaveDeadline = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/peer-review/config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contestId,
          deadlineDays,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update deadline");
      }

      setMessage({ type: "success", text: "Deadline updated successfully" });
    } catch (error) {
      console.error("Error updating deadline:", error);
      setMessage({ type: "error", text: "Failed to update deadline" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveFinalistCount = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/peer-review/config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contestId,
          finalistCount,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update finalist count");
      }

      setMessage({ type: "success", text: "Finalist count updated successfully" });
    } catch (error) {
      console.error("Error updating finalist count:", error);
      setMessage({ type: "error", text: "Failed to update finalist count" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleResultsVisibility = async () => {
    setIsSaving(true);
    setMessage(null);

    const newValue = !resultsVisible;

    try {
      const response = await fetch(`/api/admin/peer-review/config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contestId,
          resultsVisible: newValue,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update results visibility");
      }

      setResultsVisible(newValue);
      setMessage({
        type: "success",
        text: `Results ${newValue ? "visible" : "hidden"} to authors`,
      });
    } catch (error) {
      console.error("Error updating results visibility:", error);
      setMessage({ type: "error", text: "Failed to update results visibility" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-md border-2 border-[#E5E5E0]/50 rounded-2xl p-8 shadow-lg space-y-6">
      <div>
        <h2 className="text-2xl font-serif font-bold text-[#222] mb-2">
          Peer Review Configuration
        </h2>
        <p className="text-sm text-[#666]">
          Configure deadline, finalist count, and results visibility
        </p>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Deadline Configuration */}
      <div className="space-y-3">
        <label className="block">
          <span className="text-sm font-semibold text-[#222]">Review Deadline (Days)</span>
          <p className="text-xs text-[#666] mt-1 mb-2">
            Number of days reviewers have to complete their assignments
          </p>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="1"
              max="30"
              value={deadlineDays}
              onChange={(e) => setDeadlineDays(parseInt(e.target.value) || 7)}
              className="flex-1 px-4 py-2 border-2 border-[#E5E5E0] rounded-lg focus:outline-none focus:border-[#004D40] transition-colors"
              disabled={isSaving}
            />
            <button
              onClick={handleSaveDeadline}
              disabled={isSaving}
              className="px-6 py-2 bg-[#004D40] text-white rounded-lg hover:bg-[#003830] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </label>
      </div>

      {/* Finalist Count Configuration */}
      <div className="space-y-3">
        <label className="block">
          <span className="text-sm font-semibold text-[#222]">Finalist Count</span>
          <p className="text-xs text-[#666] mt-1 mb-2">
            Number of top submissions to advance to public voting
          </p>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="1"
              max="500"
              value={finalistCount}
              onChange={(e) => setFinalistCount(parseInt(e.target.value) || 100)}
              className="flex-1 px-4 py-2 border-2 border-[#E5E5E0] rounded-lg focus:outline-none focus:border-[#004D40] transition-colors"
              disabled={isSaving}
            />
            <button
              onClick={handleSaveFinalistCount}
              disabled={isSaving}
              className="px-6 py-2 bg-[#004D40] text-white rounded-lg hover:bg-[#003830] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </label>
      </div>

      {/* Results Visibility Toggle */}
      <div className="space-y-3 pt-4 border-t-2 border-[#E5E5E0]">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-semibold text-[#222] block">Results Visibility</span>
            <p className="text-xs text-[#666] mt-1">
              {resultsVisible
                ? "Authors can see their peer review scores and comments"
                : "Peer review results are hidden from authors"}
            </p>
          </div>
          <button
            onClick={handleToggleResultsVisibility}
            disabled={isSaving}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              resultsVisible ? "bg-emerald-600" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                resultsVisible ? "translate-x-7" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
