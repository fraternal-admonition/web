"use client";

import { useState, useEffect } from "react";

interface LinkDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (url: string, text: string, openInNewTab: boolean) => void;
  currentUrl?: string;
  currentText?: string;
}

export default function LinkDialog({
  isOpen,
  onClose,
  onInsert,
  currentUrl = "",
  currentText = "",
}: LinkDialogProps) {
  const [url, setUrl] = useState(currentUrl);
  const [text, setText] = useState(currentText);
  const [openInNewTab, setOpenInNewTab] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setUrl(currentUrl);
      setText(currentText);
    }
  }, [isOpen, currentUrl, currentText]);

  const handleInsert = () => {
    if (url) {
      onInsert(url, text, openInNewTab);
      setUrl("");
      setText("");
      setOpenInNewTab(true);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <h2 className="text-2xl font-serif text-[#222] mb-4">
          {currentUrl ? "Edit Link" : "Insert Link"}
        </h2>

        {/* URL Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-[#222] mb-2">
            URL *
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full px-4 py-2 border border-[#E5E5E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004D40]"
            autoFocus
          />
          <p className="mt-1 text-xs text-[#666]">
            Enter the full URL including http:// or https://
          </p>
        </div>

        {/* Link Text */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-[#222] mb-2">
            Link Text (optional)
          </label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Click here"
            className="w-full px-4 py-2 border border-[#E5E5E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004D40]"
          />
          <p className="mt-1 text-xs text-[#666]">
            Leave empty to use selected text or URL as link text
          </p>
        </div>

        {/* Open in New Tab */}
        <div className="mb-6">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={openInNewTab}
              onChange={(e) => setOpenInNewTab(e.target.checked)}
              className="w-4 h-4 text-[#004D40] border-[#E5E5E0] rounded focus:ring-[#004D40]"
            />
            <span className="text-sm text-[#222]">Open link in new tab</span>
          </label>
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
            disabled={!url}
            className="px-6 py-2 bg-[#004D40] text-white rounded-lg hover:bg-[#00695C] transition-colors disabled:opacity-50"
          >
            {currentUrl ? "Update Link" : "Insert Link"}
          </button>
        </div>
      </div>
    </div>
  );
}
