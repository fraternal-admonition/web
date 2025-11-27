"use client";

import { useState } from "react";

interface CollapsibleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (summary: string) => void;
}

export default function CollapsibleDialog({
  isOpen,
  onClose,
  onInsert,
}: CollapsibleDialogProps) {
  const [summary, setSummary] = useState("");

  const handleInsert = () => {
    if (summary.trim()) {
      onInsert(summary.trim());
      setSummary("");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-serif text-[#222] mb-4">Insert Collapsible Section</h2>

        {/* Summary Input */}
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#222] mb-2">
              Summary Text *
            </label>
            <input
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Click to expand..."
              className="w-full px-4 py-2 border border-[#E5E5E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004D40]"
              autoFocus
            />
            <p className="text-xs text-[#666] mt-1">
              This text will be visible and clickable to expand/collapse the section
            </p>
          </div>

          <div className="bg-[#F9F9F7] border border-[#E5E5E0] rounded-lg p-4">
            <h4 className="text-sm font-medium text-[#222] mb-2">How it works:</h4>
            <ul className="text-xs text-[#666] space-y-1">
              <li>• Creates an expandable/collapsible section</li>
              <li>• Users click the summary text to show/hide content</li>
              <li>• Perfect for FAQs, additional details, or optional content</li>
              <li>• After inserting, add your content inside the collapsible area</li>
            </ul>
          </div>
        </form>

        {/* Preview */}
        {summary && (
          <div className="mb-6 p-4 bg-[#F9F9F7] rounded-lg">
            <p className="text-sm font-medium text-[#222] mb-2">Preview:</p>
            <details className="border border-[#E5E5E0] rounded-lg p-3">
              <summary className="font-semibold cursor-pointer text-[#004D40]">
                {summary}
              </summary>
              <div className="mt-2 text-[#666]">
                Your content will go here...
              </div>
            </details>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 border border-[#E5E5E0] rounded-lg text-[#222] hover:bg-[#F9F9F7] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleInsert}
            disabled={!summary.trim()}
            className="px-6 py-2 bg-[#004D40] text-white rounded-lg hover:bg-[#00695C] transition-colors disabled:opacity-50"
          >
            Insert Section
          </button>
        </div>
      </div>
    </div>
  );
}
