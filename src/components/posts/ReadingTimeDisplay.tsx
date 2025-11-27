import type { ReadingTimeMode } from "@/types/posts";

interface ReadingTimeDisplayProps {
  mode: ReadingTimeMode;
  value: number;
  className?: string;
}

export function ReadingTimeDisplay({
  mode,
  value,
  className = "",
}: ReadingTimeDisplayProps) {
  // Don't display if mode is hidden
  if (mode === "hidden") {
    return null;
  }

  // Format the display text
  const displayText = value === 0 ? "< 1 min read" : `${value} min read`;

  return <span className={className}>{displayText}</span>;
}
