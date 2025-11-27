import { Editor } from "@tiptap/react";
import { useState, useRef, useEffect } from "react";

interface ColorPickerProps {
  editor: Editor;
}

export default function ColorPicker({ editor }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const colors = [
    { name: "Black", value: "#222222" },
    { name: "Dark Gray", value: "#666666" },
    { name: "Gray", value: "#999999" },
    { name: "Red", value: "#DC2626" },
    { name: "Orange", value: "#EA580C" },
    { name: "Amber", value: "#D97706" },
    { name: "Yellow", value: "#CA8A04" },
    { name: "Green", value: "#16A34A" },
    { name: "Teal", value: "#0D9488" },
    { name: "Blue", value: "#2563EB" },
    { name: "Indigo", value: "#4F46E5" },
    { name: "Purple", value: "#9333EA" },
    { name: "Pink", value: "#DB2777" },
    { name: "Brand Green", value: "#004D40" },
    { name: "Brand Gold", value: "#C19A43" },
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

  const setColor = (color: string) => {
    editor.chain().focus().setColor(color).run();
    setIsOpen(false);
  };

  const removeColor = () => {
    editor.chain().focus().unsetColor().run();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg transition-colors text-[#444] hover:bg-[#E5E5E0]"
        title="Text Color"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-[#E5E5E0] rounded-lg shadow-lg p-3 z-50">
          <div className="grid grid-cols-5 gap-2 mb-2">
            {colors.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => setColor(color.value)}
                className="w-8 h-8 rounded border-2 border-gray-300 hover:border-gray-500 transition-colors"
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={removeColor}
            className="w-full px-3 py-1 text-xs text-[#666] hover:bg-[#F9F9F7] rounded transition-colors"
          >
            Reset Color
          </button>
        </div>
      )}
    </div>
  );
}
