import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const featured = searchParams.get("featured") === "true";
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // Build query
    let query = supabase
      .from("posts")
      .select(
        `
        id,
        slug,
        title,
        excerpt,
        published_at,
        featured,
        reading_time_mode,
        reading_time_value,
        meta_title,
        meta_description,
        og_image
      `
      )
      .eq("published", true)
      .order("published_at", { ascending: false });

    // Filter by featured if requested
    if (featured) {
      query = query.eq("featured", true).limit(3);
    } else {
      query = query.range(offset, offset + limit - 1);
    }

    const { data: posts, error, count } = await query;

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
      count: count || 0,
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch posts",
      },
      { status: 500 }
    );
  }
}
