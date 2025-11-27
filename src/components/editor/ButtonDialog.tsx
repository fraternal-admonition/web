"use client";

import { useState } from "react";

interface ButtonDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (attrs: {
    text: string;
    href: string;
    variant: string;
    size: string;
    newTab: boolean;
  }) => void;
}

export default function ButtonDialog({
  isOpen,
  onClose,
  onInsert,
}: ButtonDialogProps) {
  const [text, setText] = useState("Click Here");
  const [href, setHref] = useState("");
  const [variant, setVariant] = useState("primary");
  const [size, setSize] = useState("medium");
  const [newTab, setNewTab] = useState(true);

  const handleInsert = () => {
    if (text && href) {
      onInsert({ text, href, variant, size, newTab });
      setText("Click Here");
      setHref("");
      setVariant("primary");
      setSize("medium");
      setNewTab(true);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <h2 className="text-2xl font-serif text-[#222] mb-4">Insert Button/CTA</h2>

        {/* Button Text */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-[#222] mb-2">
            Button Text *
          </label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Click Here"
            className="w-full px-4 py-2 border border-[#E5E5E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004D40]"
          />
        </div>

        {/* URL */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-[#222] mb-2">
            Link URL *
          </label>
          <input
            type="url"
            value={href}
            onChange={(e) => setHref(e.target.value)}
            placeholder="https://example.com"
            className="w-full px-4 py-2 border border-[#E5E5E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004D40]"
          />
        </div>

        {/* Variant */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-[#222] mb-2">
            Style
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: "primary", label: "Primary", color: "bg-[#004D40] text-white" },
              { value: "secondary", label: "Secondary", color: "bg-[#C19A43] text-white" },
              { value: "outline", label: "Outline", color: "border-2 border-[#004D40] text-[#004D40]" },
            ].map((v) => (
              <button
                key={v.value}
                type="button"
                onClick={() => setVariant(v.value)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  variant === v.value ? v.color : "bg-gray-100 text-gray-700"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Size */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-[#222] mb-2">
            Size
          </label>
          <div className="flex gap-2">
            {[
              { value: "small", label: "Small" },
              { value: "medium", label: "Medium" },
              { value: "large", label: "Large" },
            ].map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setSize(s.value)}
                className={`flex-1 px-4 py-2 rounded-lg border ${
                  size === s.value
                    ? "bg-[#004D40] text-white border-[#004D40]"
                    : "bg-white text-[#444] border-[#E5E5E0]"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Open in New Tab */}
        <div className="mb-6">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={newTab}
              onChange={(e) => setNewTab(e.target.checked)}
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
            disabled={!text || !href}
            className="px-6 py-2 bg-[#004D40] text-white rounded-lg hover:bg-[#00695C] transition-colors disabled:opacity-50"
          >
            Insert Button
          </button>
        </div>
      </div>
    </div>
  );
}
