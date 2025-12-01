import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { sanitizeHTML } from "@/lib/security/sanitize";
import { calculateReadingTime } from "@/lib/posts/reading-time";
import { isValidSlug } from "@/lib/posts/slug";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const adminSupabase = await createAdminClient();

    // Fetch post by ID including draft content
    const { data: post, error } = await adminSupabase
      .from("posts")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !post) {
      return NextResponse.json(
        {
          success: false,
          error: "Post not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: post,
    });
  } catch (error) {
    console.error("Error fetching post:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch post",
      },
      { status: 500 }
    );
  }
}


export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
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

    // Get existing post
    const { data: existingPost, error: fetchError } = await adminSupabase
      .from("posts")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !existingPost) {
      return NextResponse.json(
        {
          success: false,
          error: "Post not found",
        },
        { status: 404 }
      );
    }

    // Check slug uniqueness (excluding current post)
    const { data: duplicatePost } = await adminSupabase
      .from("posts")
      .select("id")
      .eq("slug", slug)
      .neq("id", id)
      .single();

    if (duplicatePost) {
      return NextResponse.json(
        {
          success: false,
          error: "A post with this slug already exists",
        },
        { status: 400 }
      );
    }

    // Check featured posts limit (max 3) - only if trying to feature this post
    if (featured && !existingPost.featured) {
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
    const sanitizedContent = await sanitizeHTML(content_rich_json.content);

    // Calculate reading time if mode is 'auto' and content changed
    let finalReadingTimeValue = reading_time_value || 0;
    if (reading_time_mode === "auto") {
      const existingContent = existingPost.body_rich_json?.content || "";
      if (sanitizedContent !== existingContent) {
        finalReadingTimeValue = calculateReadingTime(sanitizedContent);
      } else {
        finalReadingTimeValue = existingPost.reading_time_value || 0;
      }
    }

    // Prepare update data
    const updateData: any = {
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
      updated_at: new Date().toISOString(),
    };

    // Update published_at if status changes to published
    if (published && !existingPost.published) {
      updateData.published_at = new Date().toISOString();
    } else if (published && existingPost.published_at) {
      updateData.published_at = existingPost.published_at;
    }

    // Clear draft content after successful publish
    if (published) {
      updateData.draft_body_rich_json = {};
    }

    // Update post
    const { data: updatedPost, error: updateError } = await adminSupabase
      .from("posts")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating post:", updateError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to update post",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedPost,
    });
  } catch (error) {
    console.error("Error in admin posts PUT:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update post",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const adminSupabase = await createAdminClient();

    // Delete post
    const { error } = await adminSupabase
      .from("posts")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting post:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to delete post",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("Error in admin posts DELETE:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete post",
      },
      { status: 500 }
    );
  }
}
