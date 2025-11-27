# Posts/Blog Feature Documentation

## Overview

The Posts feature provides a complete blog/content management system for publishing updates, announcements, and articles on the Fraternal Admonition platform. It includes both public-facing pages and admin management interfaces.

## Features

### Public Features
- **Posts Listing Page** (`/posts`) - Browse all published posts with featured posts highlighted
- **Post Detail Pages** (`/posts/[slug]`) - Read individual posts with rich content
- **Featured Posts** - Highlight up to 3 important posts
- **Reading Time** - Display estimated reading time (auto-calculated or manual)
- **SEO Optimization** - Full meta tags support for social sharing
- **Responsive Design** - Mobile-first, works on all devices

### Admin Features
- **Posts Management** (`/admin/posts`) - View and manage all posts
- **Create Posts** (`/admin/posts/new`) - Rich text editor with full formatting
- **Edit Posts** (`/admin/posts/[id]`) - Update existing posts
- **Draft System** - Auto-save drafts every 30 seconds
- **Featured Posts Management** - Mark up to 3 posts as featured
- **Reading Time Configuration** - Auto, manual, or hidden modes
- **SEO Fields** - Custom meta title, description, OG image, and excerpt

## Database Schema

### Posts Table

```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  body_rich_json JSONB NOT NULL,
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  featured BOOLEAN DEFAULT false,
  reading_time_mode TEXT DEFAULT 'auto' CHECK (reading_time_mode IN ('manual', 'auto', 'hidden')),
  reading_time_value INTEGER DEFAULT 0,
  meta_title TEXT,
  meta_description TEXT,
  og_image TEXT,
  excerpt TEXT,
  draft_body_rich_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_posts_featured_published ON posts(featured, published, published_at DESC) 
  WHERE featured = true AND published = true;
CREATE INDEX idx_posts_published_at ON posts(published_at DESC) 
  WHERE published = true;
```

## API Routes

### Public API

#### GET `/api/posts`
Fetch all published posts.

**Query Parameters:**
- `featured` (boolean) - Filter for featured posts only
- `limit` (number) - Number of posts to return (default: 10)
- `offset` (number) - Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "slug": "post-slug",
      "title": "Post Title",
      "excerpt": "Brief summary...",
      "published_at": "2024-01-01T00:00:00Z",
      "featured": false,
      "reading_time_mode": "auto",
      "reading_time_value": 5,
      "meta_title": "SEO Title",
      "meta_description": "SEO Description",
      "og_image": "https://example.com/image.jpg"
    }
  ],
  "count": 10
}
```

#### GET `/api/posts/[slug]`
Fetch a single published post by slug.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "slug": "post-slug",
    "title": "Post Title",
    "body_rich_json": { "content": "<p>HTML content...</p>" },
    "published_at": "2024-01-01T00:00:00Z",
    "reading_time_mode": "auto",
    "reading_time_value": 5,
    "meta_title": "SEO Title",
    "meta_description": "SEO Description",
    "og_image": "https://example.com/image.jpg",
    "excerpt": "Brief summary..."
  }
}
```

### Admin API

All admin routes require authentication and admin role.

#### GET `/api/admin/posts`
Fetch all posts (published and drafts).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "slug": "post-slug",
      "title": "Post Title",
      "excerpt": "Brief summary...",
      "published": true,
      "published_at": "2024-01-01T00:00:00Z",
      "featured": false,
      "reading_time_mode": "auto",
      "reading_time_value": 5,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### POST `/api/admin/posts`
Create a new post.

**Request Body:**
```json
{
  "slug": "post-slug",
  "title": "Post Title",
  "content_rich_json": { "content": "<p>HTML content...</p>" },
  "published": false,
  "featured": false,
  "reading_time_mode": "auto",
  "reading_time_value": 0,
  "meta_title": "SEO Title",
  "meta_description": "SEO Description",
  "og_image": "https://example.com/image.jpg",
  "excerpt": "Brief summary..."
}
```

#### PUT `/api/admin/posts/[id]`
Update an existing post.

**Request Body:** Same as POST

#### DELETE `/api/admin/posts/[id]`
Delete a post.

**Response:**
```json
{
  "success": true,
  "message": "Post deleted successfully"
}
```

#### POST `/api/admin/posts/[id]/draft`
Save draft content (auto-save).

**Request Body:**
```json
{
  "draft_body_rich_json": { "content": "<p>Draft HTML content...</p>" }
}
```

## Reading Time Configuration

### Modes

1. **Auto** - Automatically calculates reading time based on word count (200 words/minute)
2. **Manual** - Admin sets a custom reading time in minutes
3. **Hidden** - Reading time is not displayed to users

### Calculation

For auto mode:
```typescript
function calculateReadingTime(html: string): number {
  const text = stripHtml(html);
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words / 200);
}
```

## Featured Posts

- Maximum of **3 featured posts** allowed
- Featured posts appear in a special section on `/posts`
- Displayed in a 3-column grid (responsive)
- Visual distinction with gold accent and star icon
- Admin UI prevents featuring more than 3 posts

## SEO Optimization

### Meta Tags

Posts support custom SEO fields:
- **Meta Title** (60 chars max) - Falls back to post title
- **Meta Description** (160 chars max) - Falls back to excerpt or first 160 chars
- **OG Image** - Social media preview image
- **Excerpt** - Brief summary for listings

### Generated Tags

```html
<title>Post Title | Fraternal Admonition</title>
<meta name="description" content="Post description..." />
<meta property="og:title" content="Post Title" />
<meta property="og:description" content="Post description..." />
<meta property="og:image" content="https://example.com/image.jpg" />
<meta property="og:type" content="article" />
<meta property="og:url" content="https://example.com/posts/slug" />
<meta name="twitter:card" content="summary_large_image" />
<link rel="canonical" href="https://example.com/posts/slug" />
```

## Admin User Guide

### Creating a Post

1. Navigate to `/admin/posts`
2. Click "+ New Post"
3. Fill in required fields:
   - **Title** - Post headline
   - **Slug** - URL-friendly identifier (auto-generated from title)
   - **Content** - Rich text content using the editor
4. Configure optional settings:
   - **Published** - Make post visible to public
   - **Featured** - Highlight post (max 3)
   - **Reading Time** - Choose mode (auto/manual/hidden)
   - **SEO Settings** - Custom meta tags
5. Click "Create Post"

### Editing a Post

1. Navigate to `/admin/posts`
2. Click "Edit" on the post you want to modify
3. Make changes to any fields
4. Changes auto-save every 30 seconds as drafts
5. Click "Save Changes" to publish updates
6. Or click "Delete Post" to remove (with confirmation)

### Managing Featured Posts

- Check "Mark as featured" when creating/editing a post
- Maximum of 3 posts can be featured at once
- If 3 posts are already featured, you'll see a warning
- Unfeature another post first before featuring a new one

### Draft System

- **Auto-save**: Drafts save automatically every 30 seconds
- **Draft Restoration**: Unsaved changes are restored when you return
- **Draft Content**: Stored separately from published content
- **Publishing**: Drafts are cleared when post is published

## Component Reference

### PostCard
Displays a post preview card.

```tsx
import { PostCard } from "@/components/posts/PostCard";

<PostCard 
  post={post} 
  featured={true} 
  variant="default" 
/>
```

### ReadingTimeDisplay
Shows reading time based on mode.

```tsx
import { ReadingTimeDisplay } from "@/components/posts/ReadingTimeDisplay";

<ReadingTimeDisplay 
  mode="auto" 
  value={5} 
/>
```

### FeaturedPostsWarning
Warns when >3 posts are featured.

```tsx
import { FeaturedPostsWarning } from "@/components/posts/FeaturedPostsWarning";

<FeaturedPostsWarning 
  currentFeaturedCount={3} 
  isCurrentPostFeatured={false} 
/>
```

## Utility Functions

### Slug Generation
```typescript
import { generateSlugFromTitle, isValidSlug } from "@/lib/posts/slug";

const slug = generateSlugFromTitle("My Post Title"); // "my-post-title"
const valid = isValidSlug("my-post-title"); // true
```

### Reading Time
```typescript
import { calculateReadingTime } from "@/lib/posts/reading-time";

const minutes = calculateReadingTime("<p>HTML content...</p>"); // 5
```

### Content Sanitization
```typescript
import { sanitizeHTML } from "@/lib/security/sanitize";

const clean = sanitizeHTML("<script>alert('xss')</script><p>Safe content</p>");
// Result: "<p>Safe content</p>"
```

## Security

### Content Sanitization
All HTML content is sanitized using DOMPurify before storage:
- Removes `<script>` tags
- Removes `<iframe>` tags
- Removes event handlers (`onclick`, `onerror`, etc.)
- Allows safe formatting tags (headings, paragraphs, lists, links, images, tables)

### Access Control
- Admin routes require authentication
- Non-admin users are redirected
- API routes validate user role on every request

### Input Validation
- Slug format: `^[a-z0-9-]+$`
- Slug uniqueness enforced
- Required fields validated
- Character limits enforced for SEO fields

## Performance

### Database Indexes
- Featured posts query uses `idx_posts_featured_published`
- Published posts listing uses `idx_posts_published_at`
- Both indexes provide fast query performance

### Caching
- Server-side rendering with `cache: "no-store"` for fresh data
- Consider adding Redis caching for production

## Troubleshooting

### Posts not appearing
- Check if post is published (`published = true`)
- Verify `published_at` is set
- Check database connection

### Featured posts not showing
- Maximum 3 featured posts
- Must be published
- Check `featured = true` and `published = true`

### Reading time not displaying
- Check `reading_time_mode` is not "hidden"
- Verify `reading_time_value` is set
- For auto mode, ensure content exists

### Slug conflicts
- Slugs must be unique
- Use different slug or modify existing post
- Check database for duplicate slugs

## Future Enhancements

Potential improvements:
- Categories/tags system
- Post search functionality
- Comments system
- Related posts
- RSS feed
- Post scheduling
- Multi-author support
- Post analytics
