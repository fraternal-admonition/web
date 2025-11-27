import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { checkAdminAuth } from "@/lib/admin-auth";
import { CMSAssetSchema } from "@/lib/security/validators";
import { logAuditEvent, getIPAddress, getUserAgent } from "@/lib/security/audit-log";

export async function GET(request: NextRequest) {
  try {
    const auth = await checkAdminAuth();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const adminSupabase = await createAdminClient();

    const { data: assets, error } = await adminSupabase
      .from("cms_assets")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ data: assets });
  } catch (error) {
    console.error("Error fetching assets:", error);
    return NextResponse.json(
      { error: "Failed to fetch assets" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await checkAdminAuth();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();

    // Validate input
    const validation = CMSAssetSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { path, alt, kind, meta } = validation.data;

    const adminSupabase = await createAdminClient();

    const { data: newAsset, error } = await adminSupabase
      .from("cms_assets")
      .insert({
        path,
        alt: alt || null,
        kind: kind || "image",
        meta: meta || {},
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
      resource_type: "cms_asset",
      resource_id: newAsset.id,
      changes: { path, alt, kind },
      ip_address: getIPAddress(request.headers),
      user_agent: getUserAgent(request.headers),
    });

    return NextResponse.json({ data: newAsset }, { status: 201 });
  } catch (error) {
    console.error("Error creating asset:", error);
    return NextResponse.json(
      { error: "Failed to create asset" },
      { status: 500 }
    );
  }
}
