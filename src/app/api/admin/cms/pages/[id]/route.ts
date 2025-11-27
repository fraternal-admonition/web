import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { checkAdminAuth } from "@/lib/admin-auth";
import { sanitizeHTML } from "@/lib/security/sanitize";
import { CMSPageSchema } from "@/lib/security/validators";
import { logAuditEvent, getIPAddress, getUserAgent } from "@/lib/security/audit-log";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await checkAdminAuth();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const adminSupabase = await createAdminClient();

    const { data: page, error } = await adminSupabase
      .from("cms_pages")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Page not found" }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json({ data: page });
  } catch (error) {
    console.error("Error fetching page:", error);
    return NextResponse.json(
      { error: "Failed to fetch page" },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    // Validate input
    const validation = CMSPageSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { slug, title, content_rich_json, published, meta_title, meta_description, og_image, excerpt } = validation.data;

    // Sanitize HTML content
    const sanitizedContent = sanitizeHTML(content_rich_json.content);

    // Calculate reading time
    const calculateReadingTime = (html: string): number => {
      const text = html.replace(/<[^>]*>/g, '');
      const words = text.split(/\s+/).length;
      return Math.ceil(words / 200); // Assuming 200 words per minute
    };

    const adminSupabase = await createAdminClient();

    // Get old page data for audit log
    const { data: oldPage } = await adminSupabase
      .from("cms_pages")
      .select("*")
      .eq("id", id)
      .single();

    // Check if slug is taken by another page
    const { data: existingPage } = await adminSupabase
      .from("cms_pages")
      .select("id")
      .eq("slug", slug)
      .neq("id", id)
      .single();

    if (existingPage) {
      return NextResponse.json(
        { error: "A page with this slug already exists" },
        { status: 400 }
      );
    }

    const { data: updatedPage, error } = await adminSupabase
      .from("cms_pages")
      .update({
        slug,
        title,
        content_rich_json: { content: sanitizedContent },
        published: published || false,
        meta_title: meta_title || null,
        meta_description: meta_description || null,
        og_image: og_image || null,
        excerpt: excerpt || null,
        reading_time: calculateReadingTime(sanitizedContent),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log audit event with changes
    const changes: Record<string, any> = {};
    if (oldPage) {
      if (oldPage.title !== title) changes.title = { old: oldPage.title, new: title };
      if (oldPage.slug !== slug) changes.slug = { old: oldPage.slug, new: slug };
      if (oldPage.published !== published) changes.published = { old: oldPage.published, new: published };
    }

    await logAuditEvent({
      user_id: auth.user!.id,
      action: "UPDATE",
      resource_type: "cms_page",
      resource_id: id,
      changes,
      ip_address: getIPAddress(request.headers),
      user_agent: getUserAgent(request.headers),
    });

    return NextResponse.json({ data: updatedPage });
  } catch (error) {
    console.error("Error updating page:", error);
    return NextResponse.json(
      { error: "Failed to update page" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await checkAdminAuth();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const adminSupabase = await createAdminClient();

    // Get page data before deletion for audit log
    const { data: page } = await adminSupabase
      .from("cms_pages")
      .select("title, slug")
      .eq("id", id)
      .single();

    const { error } = await adminSupabase
      .from("cms_pages")
      .delete()
      .eq("id", id);

    if (error) {
      throw error;
    }

    // Log audit event
    await logAuditEvent({
      user_id: auth.user!.id,
      action: "DELETE",
      resource_type: "cms_page",
      resource_id: id,
      changes: page ? { title: page.title, slug: page.slug } : undefined,
      ip_address: getIPAddress(request.headers),
      user_agent: getUserAgent(request.headers),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting page:", error);
    return NextResponse.json(
      { error: "Failed to delete page" },
      { status: 500 }
    );
  }
}
