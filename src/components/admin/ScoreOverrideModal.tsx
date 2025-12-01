"use client";

import { useState } from "react";

interface ScoreOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  reviewId: string;
  submissionCode: string;
  currentScores: {
    clarity: number;
    argument: number;
    style: number;
    moral_depth: number;
  };
  onSuccess?: () => void;
}

export default function ScoreOverrideModal({
  isOpen,
  onClose,
  reviewId,
  submissionCode,
  currentScores,
  onSuccess,
}: ScoreOverrideModalProps) {
  const [clarity, setClarity] = useState(currentScores.clarity);
  const [argument, setArgument] = useState(currentScores.argument);
  const [style, setStyle] = useState(currentScores.style);
  const [moralDepth, setMoralDepth] = useState(currentScores.moral_depth);
  const [justification, setJustification] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!justification.trim()) {
      setError("Justification is required");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/peer-review/override-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewId,
          clarity,
          argument,
          style,
          moral_depth: moralDepth,
          justification,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to override score");
      }

      // Success
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      console.error("Error overriding score:", err);
      setError(err instanceof Error ? err.message : "Failed to override score");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-serif font-bold text-[#222] mb-4">
          Override Review Scores
        </h2>

        <div className="mb-4 p-4 bg-[#F9F9F7] rounded-lg">
          <p className="text-sm text-[#666]">
            <strong>Submission:</strong> {submissionCode}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Clarity */}
          <div>
            <label className="block text-sm font-semibold text-[#222] mb-2">
              Clarity
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={clarity}
                onChange={(e) => setClarity(parseInt(e.target.value))}
                className="flex-1"
                disabled={isLoading}
              />
              <span className="text-lg font-bold text-[#222] w-8 text-center">
                {clarity}
              </span>
            </div>
          </div>

          {/* Argument */}
          <div>
            <label className="block text-sm font-semibold text-[#222] mb-2">
              Argument
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={argument}
                onChange={(e) => setArgument(parseInt(e.target.value))}
                className="flex-1"
                disabled={isLoading}
              />
              <span className="text-lg font-bold text-[#222] w-8 text-center">
                {argument}
              </span>
            </div>
          </div>

          {/* Style */}
          <div>
            <label className="block text-sm font-semibold text-[#222] mb-2">
              Style
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={style}
                onChange={(e) => setStyle(parseInt(e.target.value))}
                className="flex-1"
                disabled={isLoading}
              />
              <span className="text-lg font-bold text-[#222] w-8 text-center">
                {style}
              </span>
            </div>
          </div>

          {/* Moral Depth */}
          <div>
            <label className="block text-sm font-semibold text-[#222] mb-2">
              Moral Depth
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={moralDepth}
                onChange={(e) => setMoralDepth(parseInt(e.target.value))}
                className="flex-1"
                disabled={isLoading}
              />
              <span className="text-lg font-bold text-[#222] w-8 text-center">
                {moralDepth}
              </span>
            </div>
          </div>

          {/* Justification */}
          <div className="pt-4 border-t-2 border-[#E5E5E0]">
            <label className="block text-sm font-semibold text-[#222] mb-2">
              Justification <span className="text-red-500">*</span>
            </label>
            <textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Explain why these scores are being overridden..."
              rows={4}
              className="w-full px-4 py-2 border-2 border-[#E5E5E0] rounded-lg focus:outline-none focus:border-[#004D40] transition-colors resize-none"
              required
              disabled={isLoading}
            />
            <p className="text-xs text-[#666] mt-1">
              This justification will be logged and sent to the submission author
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border-2 border-[#E5E5E0] text-[#666] rounded-lg hover:bg-[#F9F9F7] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !justification.trim()}
              className="flex-1 px-4 py-2 bg-[#004D40] text-white rounded-lg hover:bg-[#003830] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isLoading ? "Saving..." : "Override Scores"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
