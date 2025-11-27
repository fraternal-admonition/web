import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { sanitizeHTML } from "@/lib/security/sanitize";
import { calculateReadingTime } from "@/lib/posts/reading-time";
import { isValidSlug } from "@/lib/posts/slug";

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const authResult = await checkAdminAuth();
    if (!authResult.authorized) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 403 }
      );
    }

    const adminSupabase = await createAdminClient();

    // Fetch all posts (published and drafts) for admin
    const { data: posts, error } = await adminSupabase
      .from("posts")
      .select(
        `
        id,
        slug,
        title,
        excerpt,
        published,
        published_at,
        featured,
        reading_time_mode,
        reading_time_value,
        created_at,
        updated_at
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching posts:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch posts",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: posts || [],
    });
  } catch (error) {
    console.error("Error in admin posts GET:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch posts",
      },
      { status: 500 }
    );
  }
}


export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const authResult = await checkAdminAuth();
    if (!authResult.authorized) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      slug,
      title,
      content_rich_json,
      published,
      featured,
      reading_time_mode,
      reading_time_value,
      meta_title,
      meta_description,
      og_image,
      excerpt,
    } = body;

    // Validate required fields
    if (!title || !slug || !content_rich_json?.content) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: title, slug, and content are required",
        },
        { status: 400 }
      );
    }

    // Validate slug format
    if (!isValidSlug(slug)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid slug format. Use only lowercase letters, numbers, and hyphens",
        },
        { status: 400 }
      );
    }

    const adminSupabase = await createAdminClient();

    // Check slug uniqueness
    const { data: existingPost } = await adminSupabase
      .from("posts")
      .select("id")
      .eq("slug", slug)
      .single();

    if (existingPost) {
      return NextResponse.json(
        {
          success: false,
          error: "A post with this slug already exists",
        },
        { status: 400 }
      );
    }

    // Check featured posts limit (max 3)
    if (featured) {
      const { data: featuredPosts, error: featuredError } = await adminSupabase
        .from("posts")
        .select("id")
        .eq("featured", true);

      if (featuredError) {
        console.error("Error checking featured posts:", featuredError);
      } else if (featuredPosts && featuredPosts.length >= 3) {
        return NextResponse.json(
          {
            success: false,
            error: "Maximum of 3 featured posts allowed. Please unfeature another post first.",
          },
          { status: 400 }
        );
      }
    }

    // Sanitize HTML content
    const sanitizedContent = sanitizeHTML(content_rich_json.content);

    // Calculate reading time if mode is 'auto'
    let finalReadingTimeValue = reading_time_value || 0;
    if (reading_time_mode === "auto") {
      finalReadingTimeValue = calculateReadingTime(sanitizedContent);
    }

    // Prepare post data
    const postData: any = {
      slug,
      title,
      body_rich_json: { content: sanitizedContent },
      published: published || false,
      featured: featured || false,
      reading_time_mode: reading_time_mode || "auto",
      reading_time_value: finalReadingTimeValue,
      meta_title: meta_title || null,
      meta_description: meta_description || null,
      og_image: og_image || null,
      excerpt: excerpt || null,
    };

    // Set published_at if publishing
    if (published) {
      postData.published_at = new Date().toISOString();
    }

    // Insert post
    const { data: newPost, error } = await adminSupabase
      .from("posts")
      .insert(postData)
      .select()
      .single();

    if (error) {
      console.error("Error creating post:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create post",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: newPost,
    });
  } catch (error) {
    console.error("Error in admin posts POST:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create post",
      },
      { status: 500 }
    );
  }
}
