import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { checkAdminAuth } from "@/lib/admin-auth";
import { IllustrationSchema } from "@/lib/security/validators";
import {

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
  logAuditEvent,
  getIPAddress,
  getUserAgent,
} from "@/lib/security/audit-log";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const auth = await checkAdminAuth();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;

    // Get request body
    const body = await request.json();

    // Validate input (partial schema for updates)
    const validation = IllustrationSchema.partial().safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.issues },
        { status: 400 }
      );
    }

    const updateData = validation.data;

    // Use admin client to bypass RLS
    const adminSupabase = await createAdminClient();

    // Check if illustration exists
    const { data: existingIllustration, error: fetchError } =
      await adminSupabase
        .from("illustrations")
        .select("id, title, contest_id")
        .eq("id", id)
        .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Illustration not found" },
          { status: 404 }
        );
      }
      throw fetchError;
    }

    // Check for duplicate title if title is being changed
    if (updateData.title && updateData.title !== existingIllustration.title) {
      const { data: duplicateIllustration } = await adminSupabase
        .from("illustrations")
        .select("id")
        .eq("contest_id", existingIllustration.contest_id)
        .eq("title", updateData.title)
        .neq("id", id)
        .single();

      if (duplicateIllustration) {
        return NextResponse.json(
          {
            error:
              "An illustration with this title already exists in this contest",
          },
          { status: 400 }
        );
      }
    }

    // Verify asset exists if asset_id is being changed
    if (updateData.asset_id) {
      const { data: asset, error: assetError } = await adminSupabase
        .from("cms_assets")
        .select("id")
        .eq("id", updateData.asset_id)
        .single();

      if (assetError || !asset) {
        return NextResponse.json(
          { error: "Asset not found" },
          { status: 400 }
        );
      }
    }

    // Update the illustration
    const { data: updatedIllustration, error: updateError } =
      await adminSupabase
        .from("illustrations")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

    if (updateError) {
      throw updateError;
    }

    // Log audit event
    await logAuditEvent({
      user_id: auth.user!.id,
      action: "UPDATE",
      resource_type: "illustration",
      resource_id: id,
      changes: updateData,
      ip_address: getIPAddress(request.headers),
      user_agent: getUserAgent(request.headers),
    });

    return NextResponse.json({ data: updatedIllustration });
  } catch (error) {
    console.error("Error updating illustration:", error);
    return NextResponse.json(
      { error: "Failed to update illustration" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const auth = await checkAdminAuth();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;

    // Use admin client to bypass RLS
    const adminSupabase = await createAdminClient();

    // Check if illustration exists
    const { data: existingIllustration, error: fetchError } =
      await adminSupabase
        .from("illustrations")
        .select("id, title")
        .eq("id", id)
        .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Illustration not found" },
          { status: 404 }
        );
      }
      throw fetchError;
    }

    // Check if illustration is referenced by any submissions
    const { count } = await adminSupabase
      .from("submissions")
      .select("id", { count: "exact", head: true })
      .eq("illustration_id", id);

    if (count && count > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete illustration referenced by ${count} submission${count > 1 ? "s" : ""}. Please remove the references first.`,
        },
        { status: 400 }
      );
    }

    // Delete the illustration
    const { error: deleteError } = await adminSupabase
      .from("illustrations")
      .delete()
      .eq("id", id);

    if (deleteError) {
      throw deleteError;
    }

    // Log audit event
    await logAuditEvent({
      user_id: auth.user!.id,
      action: "DELETE",
      resource_type: "illustration",
      resource_id: id,
      changes: { title: existingIllustration.title },
      ip_address: getIPAddress(request.headers),
      user_agent: getUserAgent(request.headers),
    });

    return NextResponse.json({
      success: true,
      message: "Illustration deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting illustration:", error);
    return NextResponse.json(
      { error: "Failed to delete illustration" },
      { status: 500 }
    );
  }
}
