"use client";

/**
 * Number input control for numeric settings
 * Supports min/max validation
 */
export default function NumberControl({
  value,
  onChange,
  validation,
}: {
  value: number;
  onChange: (value: number) => void;
  validation?: { min?: number; max?: number };
}) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      min={validation?.min}
      max={validation?.max}
      className={
        "w-full px-4 py-2 border border-[#E5E5E0] rounded-lg " +
        "focus:ring-2 focus:ring-[#C19A43] focus:border-[#C19A43] " +
        "transition-colors text-[#222]"
      }
    />
  );
}
