import { createClient, createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { verifyAdminRole } from "@/lib/ai-screening/security";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role using security utility
    const isAdmin = await verifyAdminRole(user.id);
    if (!isAdmin) {
      console.error(`[Admin Override] Non-admin user ${user.id} attempted to override screening`);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { screening_id, new_status } = body;

    if (!screening_id || !new_status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!["PASSED", "FAILED"].includes(new_status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be PASSED or FAILED" },
        { status: 400 }
      );
    }

    // Use admin client to bypass RLS
    const adminSupabase = await createAdminClient();

    // Get current screening status
    const { data: screening } = await adminSupabase
      .from("ai_screenings")
      .select("status")
      .eq("id", screening_id)
      .single();

    if (!screening) {
      return NextResponse.json(
        { error: "Screening not found" },
        { status: 404 }
      );
    }

    const oldStatus = screening.status;

    // Update screening status
    const { error: screeningError } = await adminSupabase
      .from("ai_screenings")
      .update({
        status: new_status,
        notes: `Manually overridden by admin from ${oldStatus} to ${new_status}`,
      })
      .eq("id", screening_id);

    if (screeningError) {
      console.error("Error updating screening:", screeningError);
      return NextResponse.json(
        { error: "Failed to update screening" },
        { status: 500 }
      );
    }

    // Update submission status
    const submissionStatus = new_status === "PASSED" ? "SUBMITTED" : "ELIMINATED";
    const { error: submissionError } = await adminSupabase
      .from("submissions")
      .update({
        status: submissionStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (submissionError) {
      console.error("Error updating submission:", submissionError);
      return NextResponse.json(
        { error: "Failed to update submission" },
        { status: 500 }
      );
    }

    // Log audit action with IP address and user agent
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    await adminSupabase.from("audit_logs").insert({
      user_id: user.id,
      action: "UPDATE",
      resource_type: "ai_screening",
      resource_id: screening_id,
      changes: {
        old_status: oldStatus,
        new_status: new_status,
        submission_id: id,
        submission_status: submissionStatus,
        override_reason: 'manual_admin_override',
      },
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    console.log(
      `[Admin] Screening ${screening_id} overridden from ${oldStatus} to ${new_status} by ${user.id}`
    );

    return NextResponse.json({
      success: true,
      screening_status: new_status,
      submission_status: submissionStatus,
    });
  } catch (error) {
    console.error("Error in override screening route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
