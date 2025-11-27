// Types for the Posts/Blog feature

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

export interface PostPublic {
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
