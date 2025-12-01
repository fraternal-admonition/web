import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { checkAdminAuth } from "@/lib/admin-auth";
import { logAuditEvent, getIPAddress, getUserAgent } from "@/lib/security/audit-log";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

    // Get asset data before deletion for audit log
    const { data: asset } = await adminSupabase
      .from("cms_assets")
      .select("path, alt, kind")
      .eq("id", id)
      .single();

    const { error } = await adminSupabase
      .from("cms_assets")
      .delete()
      .eq("id", id);

    if (error) {
      throw error;
    }

    // Log audit event
    await logAuditEvent({
      user_id: auth.user!.id,
      action: "DELETE",
      resource_type: "cms_asset",
      resource_id: id,
      changes: asset ? { path: asset.path, alt: asset.alt, kind: asset.kind } : undefined,
      ip_address: getIPAddress(request.headers),
      user_agent: getUserAgent(request.headers),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting asset:", error);
    return NextResponse.json(
      { error: "Failed to delete asset" },
      { status: 500 }
    );
  }
}
