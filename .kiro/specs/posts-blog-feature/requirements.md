# Requirements Document

## Introduction

This document outlines the requirements for implementing the Posts/Blog feature (Phase 1.4) for the Fraternal Admonition platform. The feature will be called "Posts" on the site and will provide a blog-like content management system for updates and announcements. The implementation will leverage existing CMS components and patterns from the cms_pages feature to maintain consistency and reduce development time.

## Requirements

### Requirement 1: Public Posts Listing Page

**User Story:** As a visitor, I want to view a dedicated posts page with featured posts and access to all posts, so that I can stay updated with the latest news and announcements.

#### Acceptance Criteria

1. WHEN a visitor navigates to `/posts` THEN the system SHALL display a posts listing page
2. WHEN the posts listing page loads THEN the system SHALL display up to 3 featured posts at the top of the page
3. WHEN the posts listing page loads THEN the system SHALL display a link or section to view all posts
4. WHEN no featured posts are set THEN the system SHALL display the most recent published posts
5. IF no published posts exist THEN the system SHALL display an appropriate empty state message
6. WHEN a visitor clicks on a post THEN the system SHALL navigate to `/posts/[slug]` where slug is the post's URL slug

### Requirement 2: Public Post Detail Page

**User Story:** As a visitor, I want to view individual post content at a clean URL, so that I can read the full post and share it with others.

#### Acceptance Criteria

1. WHEN a visitor navigates to `/posts/[slug]` THEN the system SHALL display the full post content
2. WHEN the post is published THEN the system SHALL render the post with title, body content, and metadata
3. WHEN the post is not published or does not exist THEN the system SHALL display a 404 error
4. WHEN the post content is rendered THEN the system SHALL use the same rich content rendering as cms_pages
5. WHEN the page loads THEN the system SHALL display SEO metadata including meta_title, meta_description, and og_image if provided

### Requirement 3: Navigation Integration

**User Story:** As a visitor, I want to access the Posts section from the main navigation, so that I can easily find blog content.

#### Acceptance Criteria

1. WHEN the site navigation renders THEN the system SHALL include a "Posts" link in the navbar
2. WHEN a visitor clicks the "Posts" navigation link THEN the system SHALL navigate to `/posts`
3. WHEN on the home page THEN the system SHALL NOT display posts content
4. WHEN the Posts link is in the navbar THEN it SHALL be visible to all users (logged in and anonymous)

### Requirement 4: Admin Posts Management - List View

**User Story:** As an admin, I want to view and manage all posts in the admin panel, so that I can maintain the blog content.

#### Acceptance Criteria

1. WHEN an admin navigates to `/admin/posts` THEN the system SHALL display a list of all posts
2. WHEN the posts list loads THEN the system SHALL display posts ordered by created_at descending
3. WHEN displaying each post THEN the system SHALL show title, slug, published status, featured status, and created date
4. WHEN the admin views the list THEN the system SHALL provide a "Create New Post" button
5. WHEN the admin clicks on a post THEN the system SHALL navigate to the edit page for that post
6. WHEN the admin clicks "Create New Post" THEN the system SHALL navigate to `/admin/posts/new`
7. WHEN the posts list is empty THEN the system SHALL display an empty state with a call-to-action to create the first post

### Requirement 5: Admin Posts Management - Create Post

**User Story:** As an admin, I want to create new posts with rich content, so that I can publish updates and announcements.

#### Acceptance Criteria

1. WHEN an admin navigates to `/admin/posts/new` THEN the system SHALL display a post creation form
2. WHEN creating a post THEN the system SHALL require a title field
3. WHEN creating a post THEN the system SHALL require a unique slug field
4. WHEN creating a post THEN the system SHALL provide a rich text editor for body content using the same editor as cms_pages
5. WHEN creating a post THEN the system SHALL provide a published checkbox (default: unchecked)
6. WHEN creating a post THEN the system SHALL provide a featured checkbox (default: unchecked)
7. WHEN creating a post THEN the system SHALL provide optional SEO fields: meta_title, meta_description, og_image
8. WHEN creating a post THEN the system SHALL provide an optional excerpt field
9. WHEN the admin saves a published post THEN the system SHALL set published_at to the current timestamp
10. WHEN the admin saves the post THEN the system SHALL validate that the slug is unique
11. WHEN the slug is not unique THEN the system SHALL display an error message
12. WHEN the post is successfully created THEN the system SHALL redirect to `/admin/posts`
13. WHEN the admin clicks cancel THEN the system SHALL navigate back to `/admin/posts` without saving

### Requirement 6: Admin Posts Management - Edit Post

**User Story:** As an admin, I want to edit existing posts, so that I can update content and correct errors.

#### Acceptance Criteria

1. WHEN an admin navigates to `/admin/posts/[id]` THEN the system SHALL display the post edit form with existing data
2. WHEN editing a post THEN the system SHALL allow modification of all fields: title, slug, body, published, featured, SEO fields, excerpt
3. WHEN the admin changes the published status from false to true THEN the system SHALL set published_at to the current timestamp if not already set
4. WHEN the admin changes the published status from true to false THEN the system SHALL keep the existing published_at value
5. WHEN the admin saves changes THEN the system SHALL validate that the slug is unique (excluding the current post)
6. WHEN the post is successfully updated THEN the system SHALL redirect to `/admin/posts`
7. WHEN the admin clicks cancel THEN the system SHALL navigate back to `/admin/posts` without saving changes
8. WHEN editing a post THEN the system SHALL provide a delete button
9. WHEN the admin clicks delete THEN the system SHALL prompt for confirmation before deleting
10. WHEN the admin confirms deletion THEN the system SHALL delete the post and redirect to `/admin/posts`

### Requirement 7: Featured Posts Management

**User Story:** As an admin, I want to mark up to 3 posts as featured, so that I can highlight important content on the posts page.

#### Acceptance Criteria

1. WHEN an admin marks a post as featured THEN the system SHALL set the featured flag to true
2. WHEN more than 3 posts are marked as featured THEN the system SHALL display a warning message
3. WHEN more than 3 posts are featured THEN the public posts page SHALL display only the 3 most recently published featured posts
4. WHEN an admin unmarks a featured post THEN the system SHALL set the featured flag to false
5. WHEN viewing the admin posts list THEN the system SHALL visually indicate which posts are featured

### Requirement 8: Draft Auto-Save

**User Story:** As an admin, I want my post drafts to be automatically saved, so that I don't lose work if my browser crashes or I navigate away.

#### Acceptance Criteria

1. WHEN an admin is creating or editing a post THEN the system SHALL auto-save draft content to localStorage every 30 seconds
2. WHEN an admin returns to a post with unsaved changes THEN the system SHALL prompt to restore the draft
3. WHEN a post is successfully saved THEN the system SHALL clear the localStorage draft
4. WHEN the admin discards changes THEN the system SHALL clear the localStorage draft

### Requirement 9: Content Reuse from CMS Pages

**User Story:** As a developer, I want to reuse existing CMS components for posts, so that the implementation is consistent and efficient.

#### Acceptance Criteria

1. WHEN implementing the post editor THEN the system SHALL use the same rich text editor component as cms_pages
2. WHEN rendering post content THEN the system SHALL use the same content rendering logic as cms_pages
3. WHEN styling admin post pages THEN the system SHALL use similar layouts to cms_pages but with distinct visual differences
4. WHEN implementing API routes THEN the system SHALL follow the same patterns as cms_pages API routes
5. WHEN validating post data THEN the system SHALL use similar validation logic as cms_pages

### Requirement 10: Database Schema Compliance

**User Story:** As a developer, I want to use the existing posts table schema, so that the implementation aligns with the database design.

#### Acceptance Criteria

1. WHEN creating a post THEN the system SHALL store data in the posts table with fields: id, slug, title, body_rich_json, published, published_at, created_at, updated_at
2. WHEN storing post content THEN the system SHALL save rich text content as JSON in body_rich_json field
3. WHEN a post is published THEN the system SHALL set published to true
4. WHEN a post is published for the first time THEN the system SHALL set published_at to the current timestamp
5. WHEN querying posts THEN the system SHALL use the existing posts table without modifications
6. WHEN implementing featured posts THEN the system SHALL add a featured boolean field to the posts table via migration

### Requirement 11: SEO and Metadata

**User Story:** As an admin, I want to set SEO metadata for posts, so that they are properly indexed by search engines and shared on social media.

#### Acceptance Criteria

1. WHEN creating or editing a post THEN the system SHALL provide fields for meta_title, meta_description, and og_image
2. WHEN a post detail page loads THEN the system SHALL render meta tags with the provided SEO data
3. IF meta_title is not provided THEN the system SHALL use the post title as the meta title
4. IF meta_description is not provided THEN the system SHALL use the excerpt or first 160 characters of the post body
5. WHEN og_image is provided THEN the system SHALL render Open Graph image meta tags

### Requirement 12: Admin Navigation Integration

**User Story:** As an admin, I want to access Posts management from the admin navigation, so that I can easily manage blog content.

#### Acceptance Criteria

1. WHEN the admin navigation renders THEN the system SHALL include a "Posts" link
2. WHEN an admin clicks the "Posts" navigation link THEN the system SHALL navigate to `/admin/posts`
3. WHEN on the admin dashboard THEN the system SHALL display a Posts card with the count of total posts
4. WHEN an admin clicks the Posts card THEN the system SHALL navigate to `/admin/posts`

### Requirement 13: Access Control

**User Story:** As a system, I want to restrict post management to admin users only, so that unauthorized users cannot modify content.

#### Acceptance Criteria

1. WHEN a non-admin user attempts to access `/admin/posts` THEN the system SHALL redirect to the access denied page
2. WHEN a non-admin user attempts to access post creation or edit pages THEN the system SHALL redirect to the access denied page
3. WHEN a non-admin user attempts to call post management API endpoints THEN the system SHALL return a 403 Forbidden error
4. WHEN an admin user accesses post management pages THEN the system SHALL allow full access

### Requirement 14: Reading Time Management

**User Story:** As an admin, I want to control how reading time is displayed for posts, so that I can choose between manual input, automatic calculation, or hiding it entirely.

#### Acceptance Criteria

1. WHEN creating or editing a post THEN the system SHALL provide a reading_time field with three modes: Manual, Auto, or Hidden
2. WHEN the mode is set to "Manual" THEN the system SHALL allow the admin to input a custom reading time in minutes
3. WHEN the mode is set to "Auto" THEN the system SHALL automatically calculate reading time using 200 words per minute
4. WHEN the mode is set to "Hidden" THEN the system SHALL not display reading time on the public site
5. WHEN the mode is "Auto" and the post body is updated THEN the system SHALL recalculate and store the reading time
6. WHEN displaying a post with reading time enabled THEN the system SHALL show the reading time in the format "X min read"
7. WHEN the calculated or manual reading time is less than 1 minute THEN the system SHALL display "< 1 min read"
8. WHEN the reading time mode is "Hidden" THEN the system SHALL not render any reading time indicator on the public posts listing or detail pages
9. WHEN the admin switches from "Auto" to "Manual" THEN the system SHALL preserve the last calculated value as the starting manual value
10. WHEN the admin switches from "Manual" to "Auto" THEN the system SHALL recalculate based on the current post content
