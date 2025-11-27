import { createClient, createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { verifyAdminRole, logAdminScreeningAccess } from "@/lib/ai-screening/security";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: Request, { params }: RouteParams) {
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
      console.error(`[Admin Submissions] Non-admin user ${user.id} attempted to view submission ${id}`);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Use admin client to bypass RLS
    const adminSupabase = await createAdminClient();

    // Fetch submission with all related data
    const { data: submission, error } = await adminSupabase
      .from("submissions")
      .select(
        `
        *,
        contest:contests(id, title, phase, submissions_close_at),
        illustration:illustrations(
          id,
          title,
          asset:cms_assets(path, alt)
        ),
        payment:payments(
          id,
          purpose,
          amount,
          currency,
          status,
          external_ref,
          created_at
        ),
        ai_screenings(
          id,
          status,
          phase,
          model_name,
          model_version,
          prompt_hash,
          scores,
          notes,
          created_at
        )
      `
      )
      .eq("id", id)
      .single();

    if (error || !submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // Fetch user email from auth.users
    const { data: authUser } = await adminSupabase.auth.admin.getUserById(submission.user_id);

    submission.user = {
      id: submission.user_id,
      email: authUser?.user?.email || "Unknown"
    };

    // Log admin access to screening results if they exist
    if (submission.ai_screenings && submission.ai_screenings.length > 0) {
      const screeningId = submission.ai_screenings[0].id;
      await logAdminScreeningAccess(user.id, id, screeningId);
      console.log(`[Admin Submissions] Admin ${user.id} viewed screening results for submission ${id}`);
    }

    return NextResponse.json({ data: submission });
  } catch (error) {
    console.error("Error fetching submission:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
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
      console.error(`[Admin Submissions] Non-admin user ${user.id} attempted to update submission ${id}`);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Use admin client to bypass RLS
    const adminSupabase = await createAdminClient();

    // Parse request body
    const body = await request.json();
    const { status } = body;

    // Validate status
    const validStatuses = [
      "PENDING_PAYMENT",
      "SUBMITTED",
      "DISQUALIFIED",
      "FINALIST",
      "WINNER",
    ];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Update submission
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    // If marking as SUBMITTED, set submitted_at
    if (status === "SUBMITTED") {
      updateData.submitted_at = new Date().toISOString();
    }

    const { data: submission, error } = await adminSupabase
      .from("submissions")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating submission:", error);
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
      resource_type: "submission",
      resource_id: id,
      changes: {
        old_status: body.old_status,
        new_status: status,
        action: 'status_update',
      },
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    return NextResponse.json({ data: submission });
  } catch (error) {
    console.error("Error updating submission:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
