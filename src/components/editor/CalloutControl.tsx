import { Editor } from "@tiptap/react";
import { useState, useRef, useEffect } from "react";

interface CalloutControlProps {
  editor: Editor;
}

export default function CalloutControl({ editor }: CalloutControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const callouts = [
    { type: "info", label: "Info", icon: "ℹ️", color: "text-blue-600" },
    { type: "warning", label: "Warning", icon: "⚠️", color: "text-yellow-600" },
    { type: "success", label: "Success", icon: "✅", color: "text-green-600" },
    { type: "error", label: "Error", icon: "❌", color: "text-red-600" },
    { type: "tip", label: "Tip", icon: "💡", color: "text-purple-600" },
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

  const insertCallout = (type: string) => {
    editor.chain().focus().setCallout(type).run();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg transition-colors text-[#444] hover:bg-[#E5E5E0]"
        title="Insert Callout"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M11 15h2v2h-2zm0-8h2v6h-2zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-[#E5E5E0] rounded-lg shadow-lg py-1 z-50 min-w-[150px]">
          {callouts.map((callout) => (
            <button
              key={callout.type}
              type="button"
              onClick={() => insertCallout(callout.type)}
              className="w-full px-4 py-2 text-left hover:bg-[#F9F9F7] transition-colors flex items-center gap-2"
            >
              <span className="text-lg">{callout.icon}</span>
              <span className={`text-sm font-medium ${callout.color}`}>
                {callout.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
