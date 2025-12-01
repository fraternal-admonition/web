import { NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { sendVerificationCompleteEmail } from "@/lib/email";

export async function POST(request: Request) {
  // Check admin authentication
  const authResult = await checkAdminAuth();
  if (!authResult.authorized) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  try {
    const { submission_id, outcome, justification } = await request.json();

    // Validate input
    if (!submission_id) {
      return NextResponse.json(
        { error: "Submission ID is required" },
        { status: 400 }
      );
    }

    if (!outcome || !["REINSTATED", "ELIMINATED", "AI_DECISION_UPHELD"].includes(outcome)) {
      return NextResponse.json(
        { error: "Valid outcome is required (REINSTATED, ELIMINATED, or AI_DECISION_UPHELD)" },
        { status: 400 }
      );
    }

    if (!justification || justification.trim().length < 20) {
      return NextResponse.json(
        { error: "Justification is required (minimum 20 characters)" },
        { status: 400 }
      );
    }

    const supabase = await createAdminClient();

    // Fetch the submission
    const { data: submission, error: submissionError } = await supabase
      .from("submissions")
      .select(
        `
        id,
        submission_code,
        title,
        status,
        user_id,
        contest_id,
        peer_verification_result,
        user:users!submissions_user_id_fkey(
          id,
          display_id
        ),
        contest:contests(
          id,
          phase
        )
      `
      )
      .eq("id", submission_id)
      .single();

    if (submissionError || !submission) {
      console.error("[Admin API] Submission not found:", submissionError);
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // Verify submission is in peer verification
    if (submission.status !== "PEER_VERIFICATION_PENDING" && submission.status !== "REINSTATED" && submission.status !== "ELIMINATED") {
      return NextResponse.json(
        { error: "Can only override peer verification submissions" },
        { status: 400 }
      );
    }

    // Determine new status based on outcome
    let newStatus: string;
    let message: string;

    switch (outcome) {
      case "REINSTATED":
        newStatus = "REINSTATED";
        message = "Admin override: Your submission has been reinstated.";
        break;
      case "ELIMINATED":
        newStatus = "ELIMINATED";
        message = "Admin override: AI elimination decision confirmed.";
        break;
      case "AI_DECISION_UPHELD":
        newStatus = "ELIMINATED";
        message = "Admin override: AI decision upheld.";
        break;
      default:
        return NextResponse.json(
          { error: "Invalid outcome" },
          { status: 400 }
        );
    }

    // Store original result for audit trail
    const originalResult = submission.peer_verification_result || {};

    // Update submission with override
    const overrideResult = {
      ...originalResult,
      admin_override: true,
      admin_override_outcome: outcome,
      admin_override_justification: justification,
      admin_override_by: authResult.user.id,
      admin_override_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from("submissions")
      .update({
        status: newStatus,
        peer_verification_result: overrideResult,
        updated_at: new Date().toISOString(),
      })
      .eq("id", submission_id);

    if (updateError) {
      console.error("[Admin API] Error updating submission:", updateError);
      return NextResponse.json(
        { error: "Failed to update submission" },
        { status: 500 }
      );
    }

    // Log admin action in audit_logs
    await supabase.from("audit_logs").insert({
      user_id: authResult.user.id,
      action: "UPDATE",
      resource_type: "peer_verification_result",
      resource_id: submission_id,
      changes: {
        action: "override",
        original_status: submission.status,
        new_status: newStatus,
        outcome,
        justification,
        original_result: originalResult,
      },
    });

    // Send notification email to author
    try {
      // Fetch author email from auth.users
      const { data: authUser } = await supabase.auth.admin.getUserById(
        submission.user_id
      );

      if (authUser?.user?.email) {
        const reinstateVotes = originalResult.reinstate_votes || 0;
        const eliminateVotes = originalResult.eliminate_votes || 0;
        const totalVotes = originalResult.total_votes || 10;
        const resultsUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/contest/screening-results/${submission_id}`;

        await sendVerificationCompleteEmail(
          authUser.user.email,
          submission.submission_code,
          submission.title,
          outcome as 'REINSTATED' | 'ELIMINATED_CONFIRMED' | 'AI_DECISION_UPHELD',
          reinstateVotes,
          eliminateVotes,
          totalVotes,
          `${message} (Admin Override)`,
          resultsUrl,
          (submission.contest as any)?.[0]?.phase || "UNKNOWN"
        );
      }
    } catch (emailError) {
      console.error("[Admin API] Failed to send email:", emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: "Verification result successfully overridden",
      submission_id,
      outcome,
      new_status: newStatus,
      justification,
    });
  } catch (error) {
    console.error("[Admin API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
