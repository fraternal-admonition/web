# Design Document

## Overview

The Posts/Blog feature provides a content management system for publishing updates, announcements, and blog-style content on the Fraternal Admonition platform. The design leverages existing CMS components and patterns from the cms_pages implementation to ensure consistency and reduce development effort. Posts will be accessible at `/posts` (listing) and `/posts/[slug]` (individual post), with admin management at `/admin/posts`.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Public Interface                        │
├─────────────────────────────────────────────────────────────┤
│  /posts (listing)          │  /posts/[slug] (detail)        │
│  - Featured posts (max 3)  │  - Full post content           │
│  - All posts link          │  - SEO metadata                │
│  - Reading time display    │  - Reading time (if enabled)   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer                               │
├─────────────────────────────────────────────────────────────┤
│  /api/posts/[slug]         │  /api/admin/posts/*            │
│  - GET published post      │  - CRUD operations             │
│                            │  - Draft management            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Admin Interface                           │
├─────────────────────────────────────────────────────────────┤
│  /admin/posts              │  /admin/posts/new              │
│  - List all posts          │  - Create new post             │
│  - Featured indicators     │  - Rich text editor            │
│  - Status badges           │  - SEO fields                  │
│                            │  - Reading time config         │
│  /admin/posts/[id]         │                                │
│  - Edit existing post      │                                │
│  - Delete post             │                                │
│  - Draft auto-save         │                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database Layer                            │
├─────────────────────────────────────────────────────────────┤
│  posts table (Supabase Postgres)                            │
│  - Core fields: id, slug, title, body_rich_json             │
│  - Status: published, published_at                          │
│  - New fields: featured, reading_time_mode,                 │
│    reading_time_value, meta_title, meta_description,        │
│    og_image, excerpt, draft_body_rich_json                  │
└─────────────────────────────────────────────────────────────┘
```

### Component Reuse Strategy

The design maximizes code reuse from the existing CMS pages implementation:

1. **Rich Text Editor**: Reuse the same editor component (`@/components/editor`)
2. **Content Rendering**: Reuse the same HTML rendering and styling patterns
3. **Form Layouts**: Adapt existing form structures with visual differentiation
4. **API Patterns**: Follow the same authentication, validation, and error handling patterns
5. **Auto-Save Logic**: Reuse the AutoSaveManager class for draft management

## Components and Interfaces

### Database Schema Extensions

The existing `posts` table needs the following additional fields:

```sql
-- Migration: add_posts_feature_fields

ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reading_time_mode TEXT DEFAULT 'auto' CHECK (reading_time_mode IN ('manual', 'auto', 'hidden')),
ADD COLUMN IF NOT EXISTS reading_time_value INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS meta_title TEXT,
ADD COLUMN IF NOT EXISTS meta_description TEXT,
ADD COLUMN IF NOT EXISTS og_image TEXT,
ADD COLUMN IF NOT EXISTS excerpt TEXT,
ADD COLUMN IF NOT EXISTS draft_body_rich_json JSONB DEFAULT '{}'::jsonb;

-- Index for featured posts query
CREATE INDEX IF NOT EXISTS idx_posts_featured_published 
ON posts(featured, published, published_at DESC) 
WHERE featured = true AND published = true;

-- Index for published posts listing
CREATE INDEX IF NOT EXISTS idx_posts_published_at 
ON posts(published_at DESC) 
WHERE published = true;
```

### TypeScript Interfaces

```typescript
// src/types/posts.ts

export type ReadingTimeMode = 'manual' | 'auto' | 'hidden';

export interface Post {
  id: string;
  slug: string;
  title: string;
  body_rich_json: { content: string };
  published: boolean;
  published_at: string | null;
  featured: boolean;
  reading_time_mode: ReadingTimeMode;
  reading_time_value: number;
  meta_title: string | null;
  meta_description: string | null;
  og_image: string | null;
  excerpt: string | null;
  draft_body_rich_json: { content: string } | null;
  created_at: string;
  updated_at: string;
}

export interface PostFormData {
  slug: string;
  title: string;
  content: string;
  published: boolean;
  featured: boolean;
  reading_time_mode: ReadingTimeMode;
  reading_time_value: number;
  meta_title: string;
  meta_description: string;
  og_image: string;
  excerpt: string;
}

export interface PostListItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  published: boolean;
  featured: boolean;
  published_at: string | null;
  reading_time_mode: ReadingTimeMode;
  reading_time_value: number;
  created_at: string;
  updated_at: string;
}
```

### API Routes

#### Public API

**GET /api/posts/[slug]**
- Fetches a single published post by slug
- Returns 404 if post is not published or doesn't exist
- Response includes all public fields including SEO metadata

```typescript
// Response format
{
  success: true,
  data: {
    id: string;
    slug: string;
    title: string;
    body_rich_json: { content: string };
    published_at: string;
    reading_time_mode: ReadingTimeMode;
    reading_time_value: number;
    meta_title: string | null;
    meta_description: string | null;
    og_image: string | null;
    excerpt: string | null;
  }
}
```

**GET /api/posts**
- Fetches all published posts with pagination
- Query params: `featured=true` (optional), `limit`, `offset`
- Returns posts ordered by published_at DESC

#### Admin API

**GET /api/admin/posts**
- Fetches all posts (published and drafts) for admin
- Requires admin authentication
- Returns posts ordered by created_at DESC

**POST /api/admin/posts**
- Creates a new post
- Requires admin authentication
- Validates slug uniqueness
- Sets published_at if published is true
- Calculates reading_time_value if mode is 'auto'

**GET /api/admin/posts/[id]**
- Fetches a single post by ID for editing
- Requires admin authentication
- Returns draft content if available

**PUT /api/admin/posts/[id]**
- Updates an existing post
- Requires admin authentication
- Validates slug uniqueness (excluding current post)
- Updates published_at if status changes to published
- Recalculates reading_time_value if mode is 'auto' and content changed
- Clears draft_body_rich_json after successful publish

**DELETE /api/admin/posts/[id]**
- Deletes a post
- Requires admin authentication
- Returns success confirmation

**POST /api/admin/posts/[id]/draft**
- Saves draft content for a post
- Requires admin authentication
- Stores content in draft_body_rich_json
- Used by auto-save functionality

### Page Components

#### Public Pages

**`/posts` - Posts Listing Page**

Layout structure:
```
┌─────────────────────────────────────────────────────┐
│                    Header                            │
│  "Posts" title with subtitle                        │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│              Featured Posts Section                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ Featured │  │ Featured │  │ Featured │          │
│  │  Post 1  │  │  Post 2  │  │  Post 3  │          │
│  └──────────┘  └──────────┘  └──────────┘          │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│                All Posts Section                     │
│  Link: "View All Posts →"                           │
│  ┌───────────────────────────────────────────────┐  │
│  │ Post Title                                    │  │
│  │ Excerpt... • X min read • Date               │  │
│  └───────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────┐  │
│  │ Post Title                                    │  │
│  │ Excerpt... • X min read • Date               │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

Features:
- Server-side rendering for SEO
- Featured posts displayed as cards with images (if og_image provided)
- Reading time displayed conditionally based on reading_time_mode
- Responsive grid layout (3 columns on desktop, 1 on mobile)
- Empty state if no posts exist

**`/posts/[slug]` - Post Detail Page**

Layout structure:
```
┌─────────────────────────────────────────────────────┐
│  ← Back to Posts                                    │
│                                                      │
│  Post Title (Large, Serif)                         │
│  Published Date • X min read (if enabled)          │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│                                                      │
│              Rich Content Area                       │
│  (Rendered HTML with prose styling)                 │
│                                                      │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│  ← Return to Posts                                  │
└─────────────────────────────────────────────────────┘
```

Features:
- Server-side rendering for SEO
- SEO meta tags (title, description, og:image)
- Responsive typography
- Same content rendering as CMS pages
- 404 handling for unpublished/missing posts

#### Admin Pages

**`/admin/posts` - Posts Management List**

Similar to `/admin/cms/pages` but with distinct styling:
- Different header color scheme (use accent color for "Posts")
- Additional "Featured" column with visual indicator
- Reading time display in list
- Status badges (Published/Draft)
- Action buttons (Edit, Delete)

**`/admin/posts/new` - Create New Post**

Form sections:
1. **Basic Information**
   - Title (required)
   - Slug (required, auto-generated from title with manual override)
   - Rich text editor for content (required)

2. **Publishing Options**
   - Published checkbox
   - Featured checkbox (with warning if >3 posts are featured)

3. **Reading Time Configuration**
   - Radio buttons: Manual / Auto / Hidden
   - Number input (shown only when Manual is selected)
   - Auto-calculated value display (shown only when Auto is selected)

4. **SEO Settings** (collapsible section)
   - Meta Title (60 char limit with counter)
   - Meta Description (160 char limit with counter)
   - OG Image URL
   - Excerpt (textarea)

5. **Actions**
   - Cancel button (returns to list)
   - Save button (creates post)

Features:
- Auto-save to localStorage every 30 seconds
- Draft restoration on page reload
- Real-time slug validation
- Character counters for SEO fields
- Featured posts warning (if >3 already featured)

**`/admin/posts/[id]` - Edit Post**

Same layout as create page but:
- Pre-populated with existing data
- Draft content loaded if available
- Delete button in actions section
- Auto-save to database (draft_body_rich_json)
- Confirmation dialog for delete action

### Shared Components

**ReadingTimeDisplay Component**
```typescript
interface ReadingTimeDisplayProps {
  mode: ReadingTimeMode;
  value: number;
  className?: string;
}

// Renders reading time based on mode:
// - 'hidden': returns null
// - 'manual' or 'auto': displays "X min read" or "< 1 min read"
```

**PostCard Component**
```typescript
interface PostCardProps {
  post: PostListItem;
  featured?: boolean;
}

// Displays post preview with:
// - Title
// - Excerpt (truncated)
// - Reading time (if enabled)
// - Published date
// - Featured badge (if featured)
// - Click handler to navigate to post detail
```

**FeaturedPostsWarning Component**
```typescript
interface FeaturedPostsWarningProps {
  currentFeaturedCount: number;
  isCurrentPostFeatured: boolean;
}

// Displays warning banner if >3 posts are featured
// Shows count and suggests unfeaturing other posts
```

## Data Models

### Post Entity

```typescript
class PostEntity {
  id: string;
  slug: string;
  title: string;
  body_rich_json: { content: string };
  published: boolean;
  published_at: Date | null;
  featured: boolean;
  reading_time_mode: ReadingTimeMode;
  reading_time_value: number;
  meta_title: string | null;
  meta_description: string | null;
  og_image: string | null;
  excerpt: string | null;
  draft_body_rich_json: { content: string } | null;
  created_at: Date;
  updated_at: Date;

  // Methods
  calculateReadingTime(): number {
    // Extract text from HTML content
    // Count words
    // Calculate time at 200 words/minute
    // Return rounded minutes
  }

  shouldDisplayReadingTime(): boolean {
    return this.reading_time_mode !== 'hidden';
  }

  getReadingTimeValue(): number {
    if (this.reading_time_mode === 'manual') {
      return this.reading_time_value;
    }
    if (this.reading_time_mode === 'auto') {
      return this.calculateReadingTime();
    }
    return 0;
  }

  getMetaTitle(): string {
    return this.meta_title || this.title;
  }

  getMetaDescription(): string {
    if (this.meta_description) return this.meta_description;
    if (this.excerpt) return this.excerpt;
    // Extract first 160 chars from content
    return this.extractTextFromContent().substring(0, 160);
  }
}
```

### Validation Rules

**Slug Validation**
- Pattern: `^[a-z0-9-]+$`
- Min length: 1
- Max length: 100
- Must be unique within posts table
- Auto-generated from title (lowercase, spaces to hyphens, special chars removed)

**Title Validation**
- Required
- Min length: 1
- Max length: 200

**Content Validation**
- Required
- Must be valid HTML
- Sanitized on server-side before storage

**Reading Time Validation**
- Mode must be one of: 'manual', 'auto', 'hidden'
- If mode is 'manual', value must be >= 0

**SEO Fields Validation**
- meta_title: max 60 characters
- meta_description: max 160 characters
- og_image: must be valid URL if provided
- excerpt: max 500 characters

## Error Handling

### Client-Side Error Handling

1. **Form Validation Errors**
   - Display inline error messages below fields
   - Prevent form submission until errors are resolved
   - Highlight invalid fields with red border

2. **API Request Errors**
   - Display toast notifications for transient errors
   - Display banner for persistent errors
   - Provide retry mechanisms

3. **Auto-Save Errors**
   - Silent failure with console logging
   - Retry after 10 seconds
   - Display warning if multiple failures occur

### Server-Side Error Handling

1. **Authentication Errors**
   - Return 401 Unauthorized for unauthenticated requests
   - Return 403 Forbidden for non-admin users
   - Redirect to login page on client

2. **Validation Errors**
   - Return 400 Bad Request with detailed error messages
   - Include field-specific error information

3. **Database Errors**
   - Return 500 Internal Server Error
   - Log error details for debugging
   - Return generic error message to client

4. **Not Found Errors**
   - Return 404 Not Found for missing posts
   - Display user-friendly 404 page

### Error Response Format

```typescript
{
  success: false,
  error: string, // User-friendly error message
  details?: {    // Optional detailed error info
    field?: string,
    code?: string,
    message?: string
  }
}
```

## Testing Strategy

### Unit Tests

1. **Utility Functions**
   - Reading time calculation
   - Slug generation
   - Text extraction from HTML
   - Validation functions

2. **Components**
   - ReadingTimeDisplay rendering
   - PostCard rendering
   - FeaturedPostsWarning logic
   - Form validation

### Integration Tests

1. **API Routes**
   - POST /api/admin/posts (create)
   - PUT /api/admin/posts/[id] (update)
   - DELETE /api/admin/posts/[id] (delete)
   - GET /api/posts/[slug] (public access)
   - Authentication and authorization

2. **Database Operations**
   - CRUD operations
   - Slug uniqueness constraint
   - Featured posts query
   - Published posts query

### End-to-End Tests

1. **Admin Workflows**
   - Create new post
   - Edit existing post
   - Delete post
   - Toggle featured status
   - Publish/unpublish post
   - Auto-save functionality

2. **Public Workflows**
   - View posts listing
   - View featured posts
   - View individual post
   - Navigate between posts
   - 404 handling

### Manual Testing Checklist

- [ ] Create post with all fields populated
- [ ] Create post with minimal fields
- [ ] Edit post and verify changes persist
- [ ] Delete post and verify removal
- [ ] Toggle featured status and verify listing
- [ ] Test reading time modes (manual, auto, hidden)
- [ ] Verify SEO meta tags render correctly
- [ ] Test auto-save functionality
- [ ] Test draft restoration
- [ ] Verify slug uniqueness validation
- [ ] Test with >3 featured posts
- [ ] Verify published/unpublished visibility
- [ ] Test responsive layouts
- [ ] Verify navigation integration
- [ ] Test access control (admin vs non-admin)

## Performance Considerations

### Database Optimization

1. **Indexes**
   - Index on (featured, published, published_at) for featured posts query
   - Index on (published_at) for published posts listing
   - Index on (slug) for slug lookups (already exists as unique constraint)

2. **Query Optimization**
   - Limit fields selected in list queries (exclude body content)
   - Use pagination for large result sets
   - Cache featured posts query (short TTL)

### Client-Side Optimization

1. **Code Splitting**
   - Lazy load rich text editor
   - Lazy load admin pages
   - Separate bundles for public and admin

2. **Image Optimization**
   - Use Next.js Image component for og_image
   - Lazy load images in post listing
   - Provide responsive image sizes

3. **Caching**
   - Cache published posts on client
   - Use SWR or React Query for data fetching
   - Implement stale-while-revalidate strategy

### Server-Side Optimization

1. **API Response Caching**
   - Cache published posts list (5 minute TTL)
   - Cache individual published posts (10 minute TTL)
   - Invalidate cache on post update/delete

2. **Database Connection Pooling**
   - Reuse Supabase client connections
   - Implement connection pooling for high traffic

## Security Considerations

### Authentication and Authorization

1. **Admin Routes**
   - All `/admin/posts/*` routes require admin authentication
   - Use `requireAdmin()` middleware
   - Verify user role on every request

2. **API Routes**
   - All `/api/admin/posts/*` routes require admin authentication
   - Validate user session on every request
   - Return 403 for unauthorized access

### Input Validation and Sanitization

1. **Content Sanitization**
   - Sanitize HTML content before storage
   - Use DOMPurify or similar library
   - Remove dangerous tags and attributes
   - Preserve safe formatting tags

2. **SQL Injection Prevention**
   - Use parameterized queries (Supabase handles this)
   - Never concatenate user input into queries
   - Validate all input types

3. **XSS Prevention**
   - Sanitize all user-generated content
   - Use React's built-in XSS protection
   - Set appropriate Content-Security-Policy headers

### CSRF Protection

- Use CSRF tokens for state-changing operations
- Validate tokens on all POST/PUT/DELETE requests
- Implement same-site cookie policy

### Rate Limiting

- Implement rate limiting on API routes
- Limit post creation to prevent spam
- Limit auto-save requests

## Accessibility

### WCAG AA Compliance

1. **Semantic HTML**
   - Use proper heading hierarchy (h1, h2, h3)
   - Use semantic elements (article, nav, main)
   - Provide alt text for images

2. **Keyboard Navigation**
   - All interactive elements keyboard accessible
   - Logical tab order
   - Focus indicators visible

3. **Screen Reader Support**
   - ARIA labels for icon buttons
   - ARIA live regions for dynamic content
   - Descriptive link text

4. **Color Contrast**
   - Maintain 4.5:1 contrast ratio for text
   - Don't rely solely on color for information
   - Provide text alternatives for visual indicators

5. **Form Accessibility**
   - Label all form inputs
   - Provide error messages
   - Group related fields with fieldset/legend

## Migration Strategy

### Database Migration

1. **Create migration file**: `add_posts_feature_fields.sql`
2. **Add new columns** to posts table
3. **Create indexes** for performance
4. **Test migration** on development database
5. **Apply migration** to production

### Data Migration

No existing data migration needed as this is a new feature. However:
- Ensure default values are set for new columns
- Verify existing posts (if any) get default values

### Rollback Plan

If issues occur:
1. **Database rollback**: Drop new columns and indexes
2. **Code rollback**: Revert to previous deployment
3. **Cache invalidation**: Clear any cached post data

## Deployment Checklist

- [ ] Database migration applied
- [ ] Environment variables configured (if any new ones)
- [ ] Admin navigation updated
- [ ] Public navigation updated
- [ ] API routes deployed
- [ ] Admin pages deployed
- [ ] Public pages deployed
- [ ] Indexes created
- [ ] Cache configuration updated
- [ ] Monitoring configured
- [ ] Error tracking configured
- [ ] Performance testing completed
- [ ] Security audit completed
- [ ] Accessibility audit completed
- [ ] Documentation updated
- [ ] Admin training completed
