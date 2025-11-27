import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { sanitizeHTML } from "@/lib/security/sanitize";

export async function POST(
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
    const { draft_content_json, title, meta_title, meta_description, og_image, excerpt } = body;

    const adminSupabase = await createAdminClient();

    // Verify post exists
    const { data: existingPost, error: fetchError } = await adminSupabase
      .from("posts")
      .select("id")
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

    // Sanitize draft content if provided
    let sanitizedDraftContent = {};
    if (draft_content_json?.content) {
      sanitizedDraftContent = {
        content: sanitizeHTML(draft_content_json.content),
      };
    }

    // Update only draft fields
    const updateData: any = {
      draft_body_rich_json: sanitizedDraftContent,
      updated_at: new Date().toISOString(),
    };

    // Optionally update metadata in draft
    if (title !== undefined) updateData.title = title;
    if (meta_title !== undefined) updateData.meta_title = meta_title || null;
    if (meta_description !== undefined) updateData.meta_description = meta_description || null;
    if (og_image !== undefined) updateData.og_image = og_image || null;
    if (excerpt !== undefined) updateData.excerpt = excerpt || null;

    const { error: updateError } = await adminSupabase
      .from("posts")
      .update(updateData)
      .eq("id", id);

    if (updateError) {
      console.error("Error saving draft:", updateError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to save draft",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Draft saved successfully",
    });
  } catch (error) {
    console.error("Error in draft save:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to save draft",
      },
      { status: 500 }
    );
  }
}
