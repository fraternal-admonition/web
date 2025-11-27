// Reading time calculation utilities for posts

import type { ReadingTimeMode } from '@/types/posts';

/**
 * Extracts plain text from HTML content by stripping all tags
 */
export function extractTextFromHTML(html: string): string {
  // Remove HTML tags
  const text = html.replace(/<[^>]*>/g, ' ');
  
  // Decode HTML entities
  const textarea = typeof document !== 'undefined' 
    ? document.createElement('textarea')
    : null;
  
  if (textarea) {
    textarea.innerHTML = text;
    return textarea.value;
  }
  
  // Fallback for server-side: basic entity decoding
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/**
 * Calculates reading time in minutes based on word count
 * Uses average reading speed of 200 words per minute
 */
export function calculateReadingTime(htmlContent: string): number {
  const text = extractTextFromHTML(htmlContent);
  
  // Split by whitespace and filter out empty strings
  const words = text
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0);
  
  const wordCount = words.length;
  
  // Calculate minutes at 200 words per minute
  const minutes = Math.ceil(wordCount / 200);
  
  // Return at least 1 minute if there's content
  return wordCount > 0 ? Math.max(1, minutes) : 0;
}

/**
 * Gets the reading time value based on mode
 * - manual: returns the stored value
 * - auto: calculates from content
 * - hidden: returns 0
 */
export function getReadingTimeValue(
  mode: ReadingTimeMode,
  storedValue: number,
  htmlContent?: string
): number {
  if (mode === 'hidden') {
    return 0;
  }
  
  if (mode === 'manual') {
    return storedValue;
  }
  
  // mode === 'auto'
  if (htmlContent) {
    return calculateReadingTime(htmlContent);
  }
  
  return storedValue; // Fallback to stored value if no content provided
}

/**
 * Formats reading time for display
 * Returns formatted string like "5 min read" or "< 1 min read"
 */
export function getReadingTimeDisplay(
  mode: ReadingTimeMode,
  value: number
): string | null {
  if (mode === 'hidden') {
    return null;
  }
  
  if (value === 0) {
    return '< 1 min read';
  }
  
  return `${value} min read`;
}

/**
 * Checks if reading time should be displayed
 */
export function shouldDisplayReadingTime(mode: ReadingTimeMode): boolean {
  return mode !== 'hidden';
}
