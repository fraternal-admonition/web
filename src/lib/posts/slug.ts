// Slug generation and validation utilities for posts

/**
 * Generates a URL-friendly slug from a title
 * - Converts to lowercase
 * - Replaces spaces with hyphens
 * - Removes special characters
 * - Removes consecutive hyphens
 * - Trims hyphens from start and end
 */
export function generateSlugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    // Replace spaces and underscores with hyphens
    .replace(/[\s_]+/g, '-')
    // Remove all non-alphanumeric characters except hyphens
    .replace(/[^a-z0-9-]/g, '')
    // Replace multiple consecutive hyphens with single hyphen
    .replace(/-+/g, '-')
    // Remove hyphens from start and end
    .replace(/^-+|-+$/g, '');
}

/**
 * Validates a slug format
 * Must contain only lowercase letters, numbers, and hyphens
 * Must not start or end with a hyphen
 * Must not be empty
 */
export function isValidSlug(slug: string): boolean {
  if (!slug || slug.length === 0) {
    return false;
  }
  
  // Check pattern: only lowercase letters, numbers, and hyphens
  const pattern = /^[a-z0-9-]+$/;
  if (!pattern.test(slug)) {
    return false;
  }
  
  // Check that it doesn't start or end with a hyphen
  if (slug.startsWith('-') || slug.endsWith('-')) {
    return false;
  }
  
  // Check that it doesn't have consecutive hyphens
  if (slug.includes('--')) {
    return false;
  }
  
  return true;
}

/**
 * Sanitizes a slug to ensure it's valid
 * Similar to generateSlugFromTitle but for user-provided slugs
 */
export function sanitizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .trim()
    // Replace spaces and underscores with hyphens
    .replace(/[\s_]+/g, '-')
    // Remove all non-alphanumeric characters except hyphens
    .replace(/[^a-z0-9-]/g, '')
    // Replace multiple consecutive hyphens with single hyphen
    .replace(/-+/g, '-')
    // Remove hyphens from start and end
    .replace(/^-+|-+$/g, '');
}

/**
 * Gets validation error message for a slug
 * Returns null if slug is valid
 */
export function getSlugValidationError(slug: string): string | null {
  if (!slug || slug.length === 0) {
    return 'Slug is required';
  }
  
  if (slug.length > 100) {
    return 'Slug must be 100 characters or less';
  }
  
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return 'Slug can only contain lowercase letters, numbers, and hyphens';
  }
  
  if (slug.startsWith('-') || slug.endsWith('-')) {
    return 'Slug cannot start or end with a hyphen';
  }
  
  if (slug.includes('--')) {
    return 'Slug cannot contain consecutive hyphens';
  }
  
  return null;
}
