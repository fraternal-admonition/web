import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { checkAdminAuth } from "@/lib/admin-auth";
import { sanitizeHTML } from "@/lib/security/sanitize";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await checkAdminAuth();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const body = await request.json();
    const { draft_content_json, title, meta_title, meta_description, og_image, excerpt } = body;

    const adminSupabase = await createAdminClient();

    // Sanitize draft content if provided
    let sanitizedDraftContent = draft_content_json;
    if (draft_content_json?.content) {
      sanitizedDraftContent = {
        ...draft_content_json,
        content: sanitizeHTML(draft_content_json.content),
      };
    }

    // Update only the draft fields, don't update the main title unless it's different
    const updateData: any = {
      draft_content_json: sanitizedDraftContent || null,
      updated_at: new Date().toISOString(),
    };

    // Only update these fields if they're provided and different
    if (title) updateData.title = title;
    if (meta_title !== undefined) updateData.meta_title = meta_title || null;
    if (meta_description !== undefined) updateData.meta_description = meta_description || null;
    if (og_image !== undefined) updateData.og_image = og_image || null;
    if (excerpt !== undefined) updateData.excerpt = excerpt || null;

    const { data: updatedPage, error } = await adminSupabase
      .from("cms_pages")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ data: updatedPage });
  } catch (error) {
    console.error("Error saving draft:", error);
    return NextResponse.json(
      { error: "Failed to save draft" },
      { status: 500 }
    );
  }
}
