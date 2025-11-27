"use client";

/**
 * Toggle switch control for boolean settings
 */
export default function BooleanControl({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#C19A43] focus:ring-offset-2 ${
        value ? 'bg-[#004D40]' : 'bg-[#E5E5E0]'
      }`}
      role="switch"
      aria-checked={value}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
          value ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}
