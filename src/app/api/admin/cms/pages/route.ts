import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { checkAdminAuth } from "@/lib/admin-auth";
import { sanitizeHTML } from "@/lib/security/sanitize";
import { CMSPageSchema } from "@/lib/security/validators";
import { logAuditEvent, getIPAddress, getUserAgent } from "@/lib/security/audit-log";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const auth = await checkAdminAuth();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Use admin client to bypass RLS
    const adminSupabase = await createAdminClient();

    const { data: pages, error } = await adminSupabase
      .from("cms_pages")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ data: pages });
  } catch (error) {
    console.error("Error fetching pages:", error);
    return NextResponse.json(
      { error: "Failed to fetch pages" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const auth = await checkAdminAuth();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Get request body
    const body = await request.json();

    // Validate input
    const validation = CMSPageSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.issues },
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

    // Use admin client to bypass RLS
    const adminSupabase = await createAdminClient();

    // Check if slug already exists
    const { data: existingPage } = await adminSupabase
      .from("cms_pages")
      .select("id")
      .eq("slug", slug)
      .single();

    if (existingPage) {
      return NextResponse.json(
        { error: "A page with this slug already exists" },
        { status: 400 }
      );
    }

    // Create the page
    const { data: newPage, error } = await adminSupabase
      .from("cms_pages")
      .insert({
        slug,
        title,
        content_rich_json: { content: sanitizedContent },
        published: published || false,
        meta_title: meta_title || null,
        meta_description: meta_description || null,
        og_image: og_image || null,
        excerpt: excerpt || null,
        reading_time: calculateReadingTime(sanitizedContent),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log audit event
    await logAuditEvent({
      user_id: auth.user!.id,
      action: "CREATE",
      resource_type: "cms_page",
      resource_id: newPage.id,
      changes: { title, slug, published },
      ip_address: getIPAddress(request.headers),
      user_agent: getUserAgent(request.headers),
    });

    return NextResponse.json({ data: newPage }, { status: 201 });
  } catch (error) {
    console.error("Error creating page:", error);
    return NextResponse.json(
      { error: "Failed to create page" },
      { status: 500 }
    );
  }
}
