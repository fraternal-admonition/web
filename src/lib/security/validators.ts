import { z } from "zod";

export interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitized?: string;
}

/**
 * Validates a URL slug format
 * Must be lowercase letters, numbers, and hyphens only
 */
export function validateSlug(slug: string): ValidationResult {
  const slugRegex = /^[a-z0-9-]+$/;

  if (!slug || slug.trim().length === 0) {
    return { valid: false, error: "Slug is required" };
  }

  if (!slugRegex.test(slug)) {
    return {
      valid: false,
      error: "Slug must contain only lowercase letters, numbers, and hyphens",
    };
  }

  if (slug.length > 100) {
    return { valid: false, error: "Slug must be 100 characters or less" };
  }

  return { valid: true, sanitized: slug.toLowerCase().trim() };
}

/**
 * Validates JSON structure
 */
export function validateJSON(jsonString: string): ValidationResult {
  if (!jsonString || jsonString.trim().length === 0) {
    return { valid: false, error: "JSON is required" };
  }

  try {
    const parsed = JSON.parse(jsonString);
    return { valid: true, sanitized: JSON.stringify(parsed) };
  } catch (error) {
    return {
      valid: false,
      error: `Invalid JSON: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Validates a URL format
 */
export function validateURL(url: string): ValidationResult {
  if (!url || url.trim().length === 0) {
    return { valid: false, error: "URL is required" };
  }

  try {
    const urlObj = new URL(url);

    // Only allow http and https protocols
    if (!["http:", "https:"].includes(urlObj.protocol)) {
      return { valid: false, error: "URL must use HTTP or HTTPS protocol" };
    }

    return { valid: true, sanitized: url.trim() };
  } catch (error) {
    return { valid: false, error: "Invalid URL format" };
  }
}

// Zod schemas for API validation
export const CMSPageSchema = z.object({
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(100, "Slug must be 100 characters or less")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  title: z.string().min(1, "Title is required").max(200, "Title must be 200 characters or less"),
  content_rich_json: z.object({
    content: z.string(),
  }),
  published: z.boolean().optional().default(false),
  meta_title: z.string().max(60, "Meta title must be 60 characters or less").optional().nullable(),
  meta_description: z
    .string()
    .max(160, "Meta description must be 160 characters or less")
    .optional()
    .nullable(),
  og_image: z.string().url("OG image must be a valid URL").optional().nullable(),
  excerpt: z.string().optional().nullable(),
});

export const CMSSettingSchema = z.object({
  key: z.string().min(1, "Key is required").max(100, "Key must be 100 characters or less"),
  value_json: z.record(z.unknown()),
});

export const CMSAssetSchema = z.object({
  path: z.string().url("Path must be a valid URL"),
  alt: z.string().max(200, "Alt text must be 200 characters or less").optional().nullable(),
  kind: z.enum(["image", "video", "document", "other"]).default("image"),
  meta: z.record(z.unknown()).optional().default({}),
});

// Contest validation schemas
export const ContestSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less'),
  slug: z.string()
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
    .max(100, 'Slug must be 100 characters or less')
    .optional()
    .nullable(),
  submissions_open_at: z.string().datetime().optional().nullable(),
  submissions_close_at: z.string().datetime().optional().nullable(),
  ai_filter_start_at: z.string().datetime().optional().nullable(),
  ai_filter_end_at: z.string().datetime().optional().nullable(),
  peer_start_at: z.string().datetime().optional().nullable(),
  peer_end_at: z.string().datetime().optional().nullable(),
  public_start_at: z.string().datetime().optional().nullable(),
  public_end_at: z.string().datetime().optional().nullable(),
  max_entries: z.number().int().positive().optional().nullable(),
  phase: z.enum([
    'SUBMISSIONS_OPEN',
    'SUBMISSIONS_CLOSED',
    'AI_FILTERING',
    'PEER_REVIEW',
    'PUBLIC_VOTING',
    'FINALIZED'
  ]).optional(),
});

export const IllustrationSchema = z.object({
  contest_id: z.string().uuid('Invalid contest ID'),
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less'),
  description: z.string().max(1000, 'Description must be 1000 characters or less').optional().nullable(),
  asset_id: z.string().uuid('Invalid asset ID').optional().nullable(),
  is_active: z.boolean(),
});

// Submission validation schemas
export const SubmissionSchema = z.object({
  contest_id: z.string().uuid('Invalid contest ID'),
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less'),
  body: z.string()
    .min(100, 'Letter must be at least 100 characters')
    .max(50000, 'Letter must be 50,000 characters or less'),
  illustration_id: z.string().uuid('Invalid illustration ID'),
  note: z.string()
    .max(100, 'Note must be 100 characters or less')
    .optional()
    .nullable(),
});

export const PaymentIntentSchema = z.object({
  submission_id: z.string().uuid('Invalid submission ID'),
});
