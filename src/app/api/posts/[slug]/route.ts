import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = await createClient();

    // Fetch published post by slug
    const { data: post, error } = await supabase
      .from("posts")
      .select(
        `
        id,
        slug,
        title,
        body_rich_json,
        published_at,
        reading_time_mode,
        reading_time_value,
        meta_title,
        meta_description,
        og_image,
        excerpt
      `
      )
      .eq("slug", slug)
      .eq("published", true)
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
