"use client";

import { SettingOption } from "@/lib/cms/setting-types";

/**
 * Dropdown select control for settings with predefined options
 */
export default function SelectControl({
  value,
  onChange,
  options,
}: {
  value: unknown;
  onChange: (value: unknown) => void;
  options: SettingOption[];
}) {
  return (
    <select
      value={String(value)}
      onChange={(e) => {
        const option = options.find(opt => String(opt.value) === e.target.value);
        if (option) {
          onChange(option.value);
        }
      }}
      className={
        "w-full px-4 py-2 border border-[#E5E5E0] rounded-lg " +
        "focus:ring-2 focus:ring-[#C19A43] focus:border-[#C19A43] " +
        "transition-colors bg-white text-[#222]"
      }
    >
      {options.map(option => (
        <option key={String(option.value)} value={String(option.value)}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
