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

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const auth = await checkAdminAuth();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id: contestId } = await params;

    // Use admin client to bypass RLS
    const adminSupabase = await createAdminClient();

    // Verify contest exists
    const { data: contest, error: contestError } = await adminSupabase
      .from("contests")
      .select("id")
      .eq("id", contestId)
      .single();

    if (contestError) {
      if (contestError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Contest not found" },
          { status: 404 }
        );
      }
      throw contestError;
    }

    // Fetch all illustrations for this contest with asset data
    const { data: illustrations, error } = await adminSupabase
      .from("illustrations")
      .select(
        `
        *,
        asset:cms_assets(path, alt)
      `
      )
      .eq("contest_id", contestId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ data: illustrations || [] });
  } catch (error) {
    console.error("[API] Error fetching illustrations:", error);
    
    if (error instanceof Error) {
      console.error("[API] Error details:", {
        message: error.message,
        stack: error.stack,
      });
    }
    
    return NextResponse.json(
      { error: "Failed to fetch illustrations. Please try again." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const auth = await checkAdminAuth();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id: contestId } = await params;

    // Get request body
    const body = await request.json();

    // Add contest_id from URL params
    const dataWithContestId = {
      ...body,
      contest_id: contestId,
    };

    // Validate input
    const validation = IllustrationSchema.safeParse(dataWithContestId);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { contest_id, title, description, asset_id, is_active } =
      validation.data;

    // Use admin client to bypass RLS
    const adminSupabase = await createAdminClient();

    // Verify contest exists
    const { data: contest, error: contestError } = await adminSupabase
      .from("contests")
      .select("id")
      .eq("id", contest_id)
      .single();

    if (contestError) {
      if (contestError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Contest not found" },
          { status: 404 }
        );
      }
      throw contestError;
    }

    // Check for duplicate title within this contest
    const { data: existingIllustration } = await adminSupabase
      .from("illustrations")
      .select("id")
      .eq("contest_id", contest_id)
      .eq("title", title)
      .single();

    if (existingIllustration) {
      return NextResponse.json(
        {
          error:
            "An illustration with this title already exists in this contest",
        },
        { status: 400 }
      );
    }

    // Verify asset exists if asset_id is provided
    if (asset_id) {
      const { data: asset, error: assetError } = await adminSupabase
        .from("cms_assets")
        .select("id")
        .eq("id", asset_id)
        .single();

      if (assetError || !asset) {
        return NextResponse.json(
          { error: "Asset not found" },
          { status: 400 }
        );
      }
    }

    // Create the illustration
    const { data: newIllustration, error } = await adminSupabase
      .from("illustrations")
      .insert({
        contest_id,
        title,
        description: description || null,
        asset_id: asset_id || null,
        is_active: is_active !== undefined ? is_active : true,
      })
      .select()
      .single();

    if (error) {
      console.error("[API] Database error creating illustration:", error);
      
      // Handle specific database errors
      if (error.code === '23503') { // Foreign key constraint violation
        return NextResponse.json(
          { error: "Invalid contest or asset reference" },
          { status: 400 }
        );
      }
      
      throw error;
    }

    // Log audit event
    await logAuditEvent({
      user_id: auth.user!.id,
      action: "CREATE",
      resource_type: "illustration",
      resource_id: newIllustration.id,
      changes: { title, contest_id, is_active },
      ip_address: getIPAddress(request.headers),
      user_agent: getUserAgent(request.headers),
    });

    return NextResponse.json({ data: newIllustration }, { status: 201 });
  } catch (error) {
    console.error("[API] Error creating illustration:", error);
    
    if (error instanceof Error) {
      console.error("[API] Error details:", {
        message: error.message,
        stack: error.stack,
      });
    }
    
    return NextResponse.json(
      { error: "Failed to create illustration. Please check your input and try again." },
      { status: 500 }
    );
  }
}
