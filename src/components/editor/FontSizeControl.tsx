import { Editor } from "@tiptap/react";
import { useState, useRef, useEffect } from "react";

interface FontSizeControlProps {
  editor: Editor;
}

export default function FontSizeControl({ editor }: FontSizeControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const sizes = [
    { label: "Small", value: "14px" },
    { label: "Normal", value: "16px" },
    { label: "Medium", value: "18px" },
    { label: "Large", value: "24px" },
    { label: "X-Large", value: "32px" },
    { label: "XX-Large", value: "48px" },
  ];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const setFontSize = (size: string) => {
    editor.chain().focus().setMark("textStyle", { fontSize: size }).run();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg transition-colors text-[#444] hover:bg-[#E5E5E0] flex items-center gap-1"
        title="Font Size"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M9 4v3h5v12h3V7h5V4H9zm-6 8h3v7h3v-7h3V9H3v3z" />
        </svg>
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
          <path d="M7 10l5 5 5-5z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-[#E5E5E0] rounded-lg shadow-lg py-1 z-50 min-w-[120px]">
          {sizes.map((size) => (
            <button
              key={size.value}
              type="button"
              onClick={() => setFontSize(size.value)}
              className="w-full px-4 py-2 text-left hover:bg-[#F9F9F7] transition-colors text-[#444]"
              style={{ fontSize: size.value }}
            >
              {size.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
