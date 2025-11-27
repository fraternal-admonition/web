# Implementation Plan

- [x] 1. Database schema and migrations


- [x] 1.1 Create migration to add posts feature fields


  - Add featured, reading_time_mode, reading_time_value, meta_title, meta_description, og_image, excerpt, draft_body_rich_json columns to posts table
  - Create indexes for featured posts and published posts queries
  - Test migration on development database
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

- [x] 2. TypeScript types and utilities


- [x] 2.1 Create posts type definitions


  - Define Post, PostFormData, PostListItem, ReadingTimeMode types in src/types/posts.ts
  - Export all types for use across the application
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 2.2 Create reading time utility functions


  - Implement calculateReadingTime function (extract text from HTML, count words, calculate at 200 wpm)
  - Implement getReadingTimeDisplay function (format display string based on mode and value)
  - Add text extraction utility to strip HTML tags
  - _Requirements: 14.2, 14.3, 14.4, 14.5, 14.6, 14.7_


- [x] 2.3 Create slug generation utility

  - Implement generateSlugFromTitle function (lowercase, replace spaces with hyphens, remove special chars)
  - Add slug validation function (pattern: ^[a-z0-9-]+$)
  - _Requirements: 5.3, 5.10, 6.3, 6.5_



- [x] 3. Database migration execution


- [x] 3.1 Apply posts feature migration to database

  - Run migration using Supabase MCP tool
  - Verify all columns and indexes are created
  - Test with sample data insertion
  - _Requirements: 10.1, 10.2_

- [x] 4. Public API routes



- [x] 4.1 Create GET /api/posts/[slug] route

  - Implement route handler to fetch single published post by slug
  - Return 404 if post not found or not published
  - Include all public fields (exclude draft content)
  - Add error handling and logging
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 13.1, 13.2, 13.3, 13.4_

- [x] 4.2 Create GET /api/posts route


  - Implement route handler to fetch all published posts
  - Support query params: featured, limit, offset
  - Order by published_at DESC
  - Return list of posts with excerpt and metadata
  - _Requirements: 1.2, 1.3, 1.4, 1.5_

- [x] 5. Admin API routes - Read operations



- [x] 5.1 Create GET /api/admin/posts route
  - Implement route handler with admin authentication check
  - Fetch all posts (published and drafts) ordered by created_at DESC
  - Include featured status and reading time info
  - Return appropriate error for non-admin users
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.7, 13.1, 13.2, 13.3, 13.4_


- [x] 5.2 Create GET /api/admin/posts/[id] route


  - Implement route handler with admin authentication check
  - Fetch single post by ID including draft content
  - Return draft_body_rich_json if available, otherwise body_rich_json
  - Handle not found errors
  - _Requirements: 6.1, 6.2, 13.1, 13.2, 13.3, 13.4_

- [x] 6. Admin API routes - Write operations


- [x] 6.1 Create POST /api/admin/posts route

  - Implement route handler with admin authentication check
  - Validate all required fields (title, slug, content)
  - Check slug uniqueness
  - Calculate reading_time_value if mode is 'auto'
  - Set published_at if published is true
  - Sanitize HTML content before storage
  - Return created post data
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 5.11, 5.12, 5.13, 9.1, 9.2, 9.3, 9.4, 9.5, 13.1, 13.2, 13.3, 13.4_

- [x] 6.2 Create PUT /api/admin/posts/[id] route



  - Implement route handler with admin authentication check
  - Validate all fields
  - Check slug uniqueness (excluding current post)
  - Update published_at if status changes to published
  - Recalculate reading_time_value if mode is 'auto' and content changed
  - Clear draft_body_rich_json after successful publish
  - Sanitize HTML content before storage
  - Return updated post data
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 14.9, 14.10, 13.1, 13.2, 13.3, 13.4_


- [x] 6.3 Create DELETE /api/admin/posts/[id] route
  - Implement route handler with admin authentication check
  - Delete post by ID
  - Return success confirmation
  - Handle not found errors
  - _Requirements: 6.8, 6.9, 6.10, 13.1, 13.2, 13.3, 13.4_

- [x] 6.4 Create POST /api/admin/posts/[id]/draft route

  - Implement route handler with admin authentication check
  - Save draft content to draft_body_rich_json
  - Update only draft fields, not published content
  - Return success confirmation
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 7. Shared components



- [x] 7.1 Create ReadingTimeDisplay component

  - Implement component to display reading time based on mode
  - Return null if mode is 'hidden'
  - Display "< 1 min read" if value is 0
  - Display "X min read" for values >= 1
  - Accept className prop for styling
  - _Requirements: 14.6, 14.7, 14.8_

- [x] 7.2 Create PostCard component

  - Implement component to display post preview
  - Show title, excerpt (truncated), reading time (if enabled), published date
  - Add featured badge if post is featured
  - Make entire card clickable to navigate to post detail
  - Support both regular and featured variants
  - _Requirements: 1.1, 1.2, 1.6, 7.5_

- [x] 7.3 Create FeaturedPostsWarning component

  - Implement component to warn when >3 posts are featured
  - Display count of currently featured posts
  - Show warning banner with suggestion to unfeature other posts
  - Only display if count exceeds 3
  - _Requirements: 7.2, 7.3_





- [x] 8. Public pages - Posts listing



- [x] 8.1 Create /posts page component

  - Implement server-side rendered page
  - Fetch featured posts (max 3, most recent)
  - Fetch all published posts
  - Display featured posts in grid layout (3 columns desktop, 1 mobile)

  - Display "View All Posts" section with list
  - Show empty state if no posts exist
  - Add SEO meta tags
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 9. Public pages - Post detail


- [x] 9.1 Create /posts/[slug] page component


  - Implement server-side rendered page
  - Fetch post by slug from API
  - Display post title, published date, reading time (if enabled)
  - Render rich content with prose styling (reuse CMS page styles)
  - Add back navigation to /posts
  - Handle 404 for unpublished/missing posts
  - Add SEO meta tags (title, description, og:image)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 10. Admin pages - Posts list



- [x] 10.1 Create /admin/posts page component


  - Implement admin-only page with authentication check
  - Fetch all posts from admin API
  - Display posts in table with columns: title, slug, status, featured, updated date
  - Add visual indicator for featured posts
  - Add status badges (Published/Draft)
  - Add "Create New Post" button
  - Show empty state if no posts exist
  - Add edit and delete actions for each post
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 7.5, 13.1, 13.2_

- [x] 10.2 Create DeletePostButton component



  - Implement delete button with confirmation dialog
  - Call DELETE API route on confirmation
  - Show loading state during deletion
  - Refresh list after successful deletion
  - Display error toast on failure
  - _Requirements: 6.8, 6.9, 6.10_

- [x] 11. Admin pages - Create post



- [x] 11.1 Create /admin/posts/new page component



  - Implement admin-only page with authentication check
  - Create form with title, slug, content (rich text editor), published, featured checkboxes
  - Add reading time configuration section (radio buttons: Manual/Auto/Hidden)
  - Show number input when Manual is selected
  - Show calculated value when Auto is selected
  - Add collapsible SEO settings section (meta_title, meta_description, og_image, excerpt)
  - Add character counters for SEO fields
  - Implement auto-save to localStorage every 30 seconds
  - Load draft from localStorage on mount
  - Auto-generate slug from title with manual override option
  - Validate slug uniqueness on blur
  - Show FeaturedPostsWarning if >3 posts are featured
  - Submit form to POST API route
  - Clear localStorage draft after successful save
  - Redirect to /admin/posts after save
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 5.11, 5.12, 5.13, 7.1, 7.2, 7.3, 8.1, 8.2, 8.3, 8.4, 9.4, 11.1, 11.2, 11.3, 11.4, 11.5, 13.1, 13.2_

- [x] 12. Admin pages - Edit post



- [x] 12.1 Create /admin/posts/[id] page component

  - Implement admin-only page with authentication check
  - Fetch post data from GET API route
  - Pre-populate form with existing data (use draft content if available)
  - Implement same form structure as create page
  - Add delete button in actions section
  - Implement auto-save to database (draft API route) every 30 seconds
  - Show last saved timestamp
  - Submit form to PUT API route
  - Redirect to /admin/posts after save
  - Show confirmation dialog before delete
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10, 8.1, 8.2, 8.3, 8.4, 14.9, 14.10, 13.1, 13.2_

- [x] 13. Navigation integration

- [x] 13.1 Add Posts link to public navigation


  - Add "Posts" link to main navbar
  - Link to /posts
  - Ensure visible to all users
  - _Requirements: 3.1, 3.2, 3.3, 3.4_



- [x] 13.2 Add Posts link to admin navigation
  - Add "Posts" link to admin sidebar/navigation
  - Link to /admin/posts
  - Position near CMS Pages link
  - _Requirements: 12.1, 12.2_



- [x] 13.3 Add Posts card to admin dashboard

  - Add Posts card to /admin page
  - Display count of total posts
  - Link to /admin/posts
  - Use consistent styling with other dashboard cards
  - _Requirements: 12.3, 12.4_

- [x] 14. Featured posts query optimization



- [x] 14.1 Implement featured posts query with proper indexing

  - Verify index on (featured, published, published_at) is being used
  - Limit query to 3 results
  - Order by published_at DESC
  - Test query performance
  - _Requirements: 1.2, 1.3, 7.4_




- [x] 15. Content sanitization


- [x] 15.1 Implement HTML sanitization for post content
  - Use existing sanitization utility from CMS pages
  - Sanitize content before storage in API routes
  - Allow safe HTML tags (headings, paragraphs, lists, links, images, tables)
  - Remove dangerous tags and attributes (script, iframe, onclick, etc.)
  - Test with various HTML inputs
  - _Requirements: 9.2, 9.3, 9.4, 9.5_

- [x] 16. SEO meta tags implementation



- [x] 16.1 Add SEO meta tags to post detail page

  - Implement meta tags for title, description, og:image
  - Use meta_title or fallback to title
  - Use meta_description or fallback to excerpt or first 160 chars
  - Add og:image if provided
  - Add og:type, og:url, twitter:card tags
  - Test with social media preview tools
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 17. Error handling and loading states



- [x] 17.1 Implement error handling for public pages
  - Add loading states for posts listing and detail pages
  - Add error states with user-friendly messages
  - Implement 404 page for missing posts
  - Add retry mechanisms for failed API calls
  - _Requirements: 2.3, 2.4_


- [x] 17.2 Implement error handling for admin pages


  - Add loading states for all admin pages
  - Add error toasts for API failures
  - Add inline validation errors for form fields
  - Add confirmation dialogs for destructive actions
  - _Requirements: 5.11, 5.12, 6.6, 6.7, 6.9, 6.10_

- [x] 18. Responsive design and styling


- [x] 18.1 Implement responsive layouts for public pages


  - Test posts listing on mobile, tablet, desktop
  - Ensure featured posts grid is responsive (3 cols → 1 col)
  - Test post detail page on all screen sizes
  - Verify typography scales appropriately
  - _Requirements: 1.1, 2.1_


- [x] 18.2 Implement responsive layouts for admin pages

  - Test admin list page on mobile, tablet, desktop
  - Ensure form layouts are responsive
  - Test rich text editor on mobile
  - Verify table scrolls horizontally on small screens
  - _Requirements: 4.1, 5.1, 6.1_



- [x] 19. Visual differentiation from CMS pages


- [x] 19.1 Apply distinct styling to admin posts pages

  - Use different accent color for "Posts" text in headers
  - Adjust card/section backgrounds slightly
  - Ensure pages are recognizably different from CMS pages
  - Maintain overall design consistency
  - _Requirements: 9.3, 9.4_

- [x] 20. Testing and validation



- [ ] 20.1 Test post creation workflow
  - Create post with all fields populated
  - Create post with minimal fields
  - Verify slug uniqueness validation
  - Test featured posts warning
  - Test reading time modes (manual, auto, hidden)
  - Verify auto-save functionality
  - _Requirements: 5.1-5.13, 7.1-7.3, 8.1-8.4, 14.1-14.10_


- [ ] 20.2 Test post editing workflow
  - Edit existing post and verify changes persist
  - Test draft restoration
  - Verify published_at updates correctly
  - Test reading time recalculation
  - Verify delete functionality
  - _Requirements: 6.1-6.10, 8.1-8.4_


- [ ] 20.3 Test public viewing workflow
  - View posts listing with featured posts
  - View individual post
  - Verify reading time displays correctly
  - Test navigation between pages
  - Verify 404 handling for unpublished posts

  - _Requirements: 1.1-1.6, 2.1-2.5, 14.6-14.8_

- [ ] 20.4 Test access control
  - Verify non-admin users cannot access admin pages
  - Verify non-admin users cannot call admin API routes
  - Test authentication redirects


  - _Requirements: 13.1-13.4_

- [x] 21. Documentation and cleanup

- [x] 21.1 Update project documentation

  - Document posts feature in README
  - Add API route documentation
  - Document reading time configuration options
  - Add admin user guide for posts management
  - _Requirements: All_



- [x] 21.2 Code cleanup and optimization


  - Remove any console.logs
  - Optimize imports
  - Remove unused code
  - Run linter and fix issues
  - _Requirements: All_
