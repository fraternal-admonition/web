"use client";

/**
 * Text input control for string settings
 * Supports both single-line and multi-line (textarea) modes
 */
export default function TextControl({
  value,
  onChange,
  multiline = false,
  validation,
}: {
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  validation?: { 
    pattern?: string; 
    minLength?: number; 
    maxLength?: number;
  };
}) {
  const commonClasses = 
    "w-full px-4 py-2 border border-[#E5E5E0] rounded-lg " +
    "focus:ring-2 focus:ring-[#C19A43] focus:border-[#C19A43] " +
    "transition-colors text-[#222] placeholder-[#666]";
  
  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className={commonClasses}
        minLength={validation?.minLength}
        maxLength={validation?.maxLength}
      />
    );
  }
  
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={commonClasses}
      pattern={validation?.pattern}
      minLength={validation?.minLength}
      maxLength={validation?.maxLength}
    />
  );
}
