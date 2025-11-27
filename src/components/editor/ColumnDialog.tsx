"use client";

import { useState } from "react";

interface ColumnDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (columnCount: number) => void;
}

export default function ColumnDialog({
  isOpen,
  onClose,
  onInsert,
}: ColumnDialogProps) {
  const [selectedColumns, setSelectedColumns] = useState(2);

  const handleInsert = () => {
    onInsert(selectedColumns);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-serif text-[#222] mb-4">Insert Columns</h2>

        {/* Column Options */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-[#222] mb-3">
            Select Number of Columns
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[2, 3, 4].map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => setSelectedColumns(count)}
                className={`p-4 border rounded-lg transition-colors ${
                  selectedColumns === count
                    ? "bg-[#004D40] text-white border-[#004D40]"
                    : "bg-white text-[#444] border-[#E5E5E0] hover:bg-[#F9F9F7]"
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl font-bold mb-1">{count}</div>
                  <div className="text-xs">Columns</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="mb-6 p-4 bg-[#F9F9F7] rounded-lg">
          <p className="text-sm font-medium text-[#222] mb-2">Preview:</p>
          <div 
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(${selectedColumns}, 1fr)` }}
          >
            {Array.from({ length: selectedColumns }, (_, i) => (
              <div
                key={i}
                className="bg-white border border-[#E5E5E0] rounded p-2 text-center text-xs text-[#666]"
              >
                Column {i + 1}
              </div>
            ))}
          </div>
          <p className="text-xs text-[#666] mt-2">
            Columns will stack vertically on mobile devices
          </p>
        </div>

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
            className="px-6 py-2 bg-[#004D40] text-white rounded-lg hover:bg-[#00695C] transition-colors"
          >
            Insert {selectedColumns} Columns
          </button>
        </div>
      </div>
    </div>
  );
}
