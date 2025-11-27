# Design Document

## Overview

The Contest Configuration feature provides administrators with a comprehensive interface to create and manage Letters to Goliath contests and their associated illustrations. This feature builds upon the existing admin infrastructure (authentication, audit logging, CMS patterns) and introduces two new admin modules: Contest Management and Illustration Management.

The design follows the established patterns from the CMS and Posts modules, utilizing server-side rendering for admin pages, API routes for CRUD operations, and the existing admin authentication system. The feature integrates seamlessly with the admin dashboard and maintains consistency with the site's design system.

## Architecture

### High-Level Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Admin Dashboard                          │
│  - Contest Stats Card                                        │
│  - Illustration Stats Card                                   │
│  - Quick Action: Create Contest                              │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
        ┌───────▼────────┐      ┌──────▼──────────┐
        │  Contest CRUD  │      │ Illustration    │
        │  Pages         │      │ CRUD Pages      │
        └───────┬────────┘      └──────┬──────────┘
                │                      │
        ┌───────▼────────┐      ┌──────▼──────────┐
        │  Contest API   │      │ Illustration    │
        │  Routes        │      │ API Routes      │
        └───────┬────────┘      └──────┬──────────┘
                │                      │
                └──────────┬───────────┘
                           │
                    ┌──────▼──────┐
                    │  Supabase   │
                    │  Database   │
                    │  - contests │
                    │  - illustrations │
                    │  - cms_assets │
                    └─────────────┘
```

### Technology Stack

- **Frontend**: Next.js 15 App Router, React Server Components, TypeScript
- **Styling**: Tailwind CSS with existing design tokens
- **Database**: Supabase PostgreSQL
- **Authentication**: Existing `requireAdmin()` and `checkAdminAuth()` helpers
- **File Upload**: Existing CMS asset upload infrastructure
- **Validation**: Zod schemas
- **Audit Logging**: Existing audit_logs table

## Components and Interfaces

### 1. Database Schema (Already Exists)

The `contests` and `illustrations` tables are already defined in the database:

**contests table:**
- `id` (uuid, PK)
- `title` (text, required)
- `slug` (text, unique, nullable)
- `phase` (contest_phase enum, default: 'SUBMISSIONS_OPEN')
- `submissions_open_at` (timestamptz, nullable)
- `submissions_close_at` (timestamptz, nullable)
- `ai_filter_start_at` (timestamptz, nullable)
- `ai_filter_end_at` (timestamptz, nullable)
- `peer_start_at` (timestamptz, nullable)
- `peer_end_at` (timestamptz, nullable)
- `public_start_at` (timestamptz, nullable)
- `public_end_at` (timestamptz, nullable)
- `max_entries` (integer, nullable)
- `peer_review_per_submission` (integer, default: 10)
- `scoring_weights` (jsonb, default: {"peer": 0.6, "public": 0.4})
- `voting_rules` (jsonb, default: {"vote_per_submission_cap": 5, "public_vote_requires_payment": true})
- `word_limits` (jsonb, default: {})
- `teaser_asset_id` (uuid, FK to cms_assets, nullable)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**illustrations table:**
- `id` (uuid, PK)
- `contest_id` (uuid, FK to contests, required)
- `title` (text, nullable)
- `description` (text, nullable)
- `asset_id` (uuid, FK to cms_assets, nullable)
- `is_active` (boolean, default: true)
- `created_at` (timestamptz)

### 2. TypeScript Types

```typescript
// src/types/contests.ts

export type ContestPhase = 
  | 'SUBMISSIONS_OPEN'
  | 'SUBMISSIONS_CLOSED'
  | 'AI_FILTERING'
  | 'PEER_REVIEW'
  | 'PUBLIC_VOTING'
  | 'FINALIZED';

export interface Contest {
  id: string;
  title: string;
  slug: string | null;
  phase: ContestPhase;
  submissions_open_at: string | null;
  submissions_close_at: string | null;
  ai_filter_start_at: string | null;
  ai_filter_end_at: string | null;
  peer_start_at: string | null;
  peer_end_at: string | null;
  public_start_at: string | null;
  public_end_at: string | null;
  max_entries: number | null;
  peer_review_per_submission: number;
  scoring_weights: {
    peer: number;
    public: number;
  };
  voting_rules: {
    vote_per_submission_cap: number;
    public_vote_requires_payment: boolean;
  };
  word_limits: Record<string, number>;
  teaser_asset_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Illustration {
  id: string;
  contest_id: string;
  title: string | null;
  description: string | null;
  asset_id: string | null;
  is_active: boolean;
  created_at: string;
  asset?: {
    path: string;
    alt: string | null;
  };
}

export interface ContestFormData {
  title: string;
  slug?: string;
  submissions_open_at?: string;
  submissions_close_at?: string;
  ai_filter_start_at?: string;
  ai_filter_end_at?: string;
  peer_start_at?: string;
  peer_end_at?: string;
  public_start_at?: string;
  public_end_at?: string;
  max_entries?: number;
}

export interface IllustrationFormData {
  contest_id: string;
  title: string;
  description?: string;
  asset_id?: string;
  is_active: boolean;
}
```

### 3. Validation Schemas

```typescript
// src/lib/security/validators.ts (additions)

import { z } from 'zod';

export const ContestSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens').optional().nullable(),
  submissions_open_at: z.string().datetime().optional().nullable(),
  submissions_close_at: z.string().datetime().optional().nullable(),
  ai_filter_start_at: z.string().datetime().optional().nullable(),
  ai_filter_end_at: z.string().datetime().optional().nullable(),
  peer_start_at: z.string().datetime().optional().nullable(),
  peer_end_at: z.string().datetime().optional().nullable(),
  public_start_at: z.string().datetime().optional().nullable(),
  public_end_at: z.string().datetime().optional().nullable(),
  max_entries: z.number().int().positive().optional().nullable(),
  phase: z.enum(['SUBMISSIONS_OPEN', 'SUBMISSIONS_CLOSED', 'AI_FILTERING', 'PEER_REVIEW', 'PUBLIC_VOTING', 'FINALIZED']).optional(),
});

export const IllustrationSchema = z.object({
  contest_id: z.string().uuid('Invalid contest ID'),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional().nullable(),
  asset_id: z.string().uuid('Invalid asset ID').optional().nullable(),
  is_active: z.boolean(),
});
```

### 4. Page Structure

**Admin Pages:**
- `/admin/contests` - Contest list page
- `/admin/contests/new` - Create new contest
- `/admin/contests/[id]` - Edit contest
- `/admin/contests/[id]/illustrations` - Manage illustrations for a contest
- `/admin/contests/[id]/illustrations/new` - Add new illustration

**API Routes:**
- `GET /api/admin/contests` - List all contests
- `POST /api/admin/contests` - Create contest
- `GET /api/admin/contests/[id]` - Get contest details
- `PATCH /api/admin/contests/[id]` - Update contest
- `DELETE /api/admin/contests/[id]` - Delete contest
- `GET /api/admin/contests/[id]/illustrations` - List illustrations for contest
- `POST /api/admin/contests/[id]/illustrations` - Create illustration
- `PATCH /api/admin/illustrations/[id]` - Update illustration
- `DELETE /api/admin/illustrations/[id]` - Delete illustration

### 5. UI Components

**ContestListTable**
- Displays contests in a table format
- Shows: title, slug, current phase, dates, entry count
- Actions: Edit, Delete (with confirmation)
- Phase badge with color coding

**ContestForm**
- Form for creating/editing contests
- Sections: Basic Info, Timeline, Advanced Settings
- Date/time pickers for all phase timestamps
- Validation feedback
- Save/Cancel actions

**IllustrationGrid**
- Grid layout displaying illustration thumbnails
- Shows: image, title, active status
- Actions: Edit, Toggle Active, Delete
- Upload new illustration button

**IllustrationForm**
- Form for adding/editing illustrations
- Image upload with preview
- Title and description fields
- Active/inactive toggle
- Save/Cancel actions

**PhaseIndicator**
- Visual indicator of current contest phase
- Color-coded badge
- Tooltip with phase description

**DeleteConfirmationDialog**
- Reusable confirmation dialog
- Shows warning about related data
- Confirm/Cancel actions

## Data Models

### Contest Lifecycle

```
SUBMISSIONS_OPEN → SUBMISSIONS_CLOSED → AI_FILTERING → PEER_REVIEW → PUBLIC_VOTING → FINALIZED
```

**Phase Transitions:**
- Automatic: Based on timestamp comparison (cron job or middleware check)
- Manual: Admin can override phase at any time

**Phase Rules:**
- SUBMISSIONS_OPEN: Users can submit entries
- SUBMISSIONS_CLOSED: No new submissions accepted
- AI_FILTERING: Submissions being screened
- PEER_REVIEW: Peer review assignments active
- PUBLIC_VOTING: Public can vote on finalists
- FINALIZED: Contest complete, winners announced

### Illustration States

- **Active**: Visible in submission form gallery
- **Inactive**: Hidden from submission form, but preserved for existing submissions

### Data Relationships

```
contests (1) ──< (many) illustrations
contests (1) ──< (many) submissions
illustrations (1) ──< (many) submissions
cms_assets (1) ──< (many) illustrations
cms_assets (1) ──< (many) contests (teaser)
```

## Error Handling

### Validation Errors
- Client-side: Form validation with inline error messages
- Server-side: Zod schema validation with detailed error responses
- Display: Toast notifications for API errors, inline for form errors

### Database Errors
- Foreign key violations: User-friendly messages (e.g., "Cannot delete contest with submissions")
- Unique constraint violations: "Slug already exists" or "Illustration title must be unique"
- Connection errors: Generic "Database error" with retry option

### Authorization Errors
- 401 Unauthorized: Redirect to signin
- 403 Forbidden: Redirect to dashboard with error message
- Banned users: Redirect to banned page

### File Upload Errors
- Invalid file type: "Please upload an image file (JPG, PNG, WebP)"
- File too large: "Image must be under 5MB"
- Upload failure: "Failed to upload image. Please try again."

## Testing Strategy

### Unit Tests
- Validation schemas (Zod)
- Utility functions (date formatting, phase calculation)
- Type guards and helpers

### Integration Tests
- API routes with mocked Supabase client
- Form submission flows
- Authentication checks

### E2E Tests (Manual for MVP)
- Create contest flow
- Edit contest and update phase
- Upload and manage illustrations
- Delete contest with validation
- Phase transition verification

### Test Data
- Seed script to create test contests
- Sample illustrations (placeholder images)
- Various contest phases for testing

## Security Considerations

### Authentication & Authorization
- All admin pages protected by `requireAdmin()`
- All API routes protected by `checkAdminAuth()`
- Audit logging for all create/update/delete operations

### Input Validation
- Zod schemas for all form inputs
- Slug sanitization (lowercase, alphanumeric, hyphens only)
- HTML sanitization for description fields
- File type validation for image uploads

### Data Protection
- No sensitive user data in contests or illustrations
- Audit logs track all admin actions
- Soft delete consideration for future (currently hard delete with FK checks)

### Rate Limiting
- Existing middleware rate limiting applies to admin API routes
- 1000 requests per hour per IP for admin endpoints

## Performance Considerations

### Database Queries
- Index on `contests.slug` (already exists as unique constraint)
- Index on `illustrations.contest_id` (FK index)
- Index on `illustrations.is_active` for filtering
- Eager loading of related assets in illustration queries

### Caching
- Contest phase can be cached with short TTL (1 minute)
- Illustration gallery cached per contest
- Admin dashboard stats cached (5 minutes)

### Image Optimization
- Use Next.js Image component for thumbnails
- Lazy loading for illustration grid
- Responsive images with multiple sizes

### Pagination
- Contest list: Paginate if > 50 contests
- Illustration grid: Paginate if > 100 illustrations
- Default page size: 20 items

## Deployment Considerations

### Database Migrations
- No migrations needed (tables already exist)
- Verify indexes exist for performance

### Environment Variables
- Use existing Supabase configuration
- No new environment variables required

### Feature Flags
- Consider feature flag for contest module visibility
- Can be controlled via cms_settings table

### Rollback Plan
- Feature is additive, no breaking changes
- Can disable by removing navigation links
- Data persists in database for future use

## Future Enhancements

### Phase 2.5 (Optional)
- Automated phase transitions via cron job
- Email notifications for phase changes
- Contest templates for quick setup
- Bulk illustration upload
- Illustration categories/tags
- Contest duplication feature

### Analytics
- Contest participation metrics
- Illustration popularity tracking
- Phase duration analytics
- Admin activity dashboard

### Advanced Features
- Multi-contest support with contest selection
- Illustration search and filtering
- Contest archival system
- Export contest data (CSV/JSON)
