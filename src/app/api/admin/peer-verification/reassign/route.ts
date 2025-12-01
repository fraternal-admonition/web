import { NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { sendAssignmentNotificationEmail } from "@/lib/email";

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
    const { assignment_id, justification } = await request.json();

    if (!assignment_id) {
      return NextResponse.json(
        { error: "Assignment ID is required" },
        { status: 400 }
      );
    }

    if (!justification || justification.trim().length < 10) {
      return NextResponse.json(
        { error: "Justification is required (minimum 10 characters)" },
        { status: 400 }
      );
    }

    const supabase = await createAdminClient();

    // Fetch the expired assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from("peer_assignments")
      .select(
        `
        id,
        submission_id,
        reviewer_user_id,
        status,
        deadline,
        submission:submissions(
          id,
          submission_code,
          title,
          contest_id
        )
      `
      )
      .eq("id", assignment_id)
      .single();

    if (assignmentError || !assignment) {
      console.error("[Admin API] Assignment not found:", assignmentError);
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    // Verify assignment is expired or pending
    if (assignment.status !== "EXPIRED" && assignment.status !== "PENDING") {
      return NextResponse.json(
        { error: "Can only reassign EXPIRED or PENDING assignments" },
        { status: 400 }
      );
    }

    // Get eligible reviewers (exclude original reviewer and users with 2+ expired assignments)
    const { data: eligibleReviewers, error: reviewersError } = await supabase
      .from("users")
      .select(
        `
        id,
        display_id,
        email:id,
        peer_assignments!peer_assignments_reviewer_user_id_fkey(
          id,
          status
        )
      `
      )
      .eq("is_banned", false)
      .neq("id", assignment.reviewer_user_id);

    if (reviewersError || !eligibleReviewers) {
      console.error("[Admin API] Error fetching reviewers:", reviewersError);
      return NextResponse.json(
        { error: "Failed to fetch eligible reviewers" },
        { status: 500 }
      );
    }

    // Filter out reviewers with 2+ expired assignments
    const validReviewers = eligibleReviewers.filter((reviewer) => {
      const expiredCount =
        reviewer.peer_assignments?.filter((a: any) => a.status === "EXPIRED")
          .length || 0;
      return expiredCount < 2;
    });

    if (validReviewers.length === 0) {
      return NextResponse.json(
        { error: "No eligible reviewers available" },
        { status: 400 }
      );
    }

    // Randomly select a new reviewer
    const newReviewer =
      validReviewers[Math.floor(Math.random() * validReviewers.length)];

    // Mark old assignment as expired (if not already)
    if (assignment.status !== "EXPIRED") {
      await supabase
        .from("peer_assignments")
        .update({ status: "EXPIRED" })
        .eq("id", assignment_id);
    }

    // Create new assignment with fresh 7-day deadline
    const newDeadline = new Date();
    newDeadline.setDate(newDeadline.getDate() + 7);

    const { data: newAssignment, error: createError } = await supabase
      .from("peer_assignments")
      .insert({
        submission_id: assignment.submission_id,
        reviewer_user_id: newReviewer.id,
        status: "PENDING",
        deadline: newDeadline.toISOString(),
      })
      .select()
      .single();

    if (createError || !newAssignment) {
      console.error("[Admin API] Error creating new assignment:", createError);
      return NextResponse.json(
        { error: "Failed to create new assignment" },
        { status: 500 }
      );
    }

    // Log admin action in audit_logs
    await supabase.from("audit_logs").insert({
      user_id: authResult.user.id,
      action: "UPDATE",
      resource_type: "peer_assignment",
      resource_id: assignment_id,
      changes: {
        action: "reassignment",
        old_reviewer_id: assignment.reviewer_user_id,
        new_reviewer_id: newReviewer.id,
        new_assignment_id: newAssignment.id,
        justification,
      },
    });

    // Send notification email to new reviewer
    try {
      // Fetch reviewer email from auth.users
      const { data: authUser } = await supabase.auth.admin.getUserById(
        newReviewer.id
      );

      if (authUser?.user?.email) {
        await sendAssignmentNotificationEmail(
          authUser.user.email,
          {
            reviewer_name: newReviewer.display_id,
            assignment_count: 1,
            deadline: newDeadline.toISOString(),
          }
        );
      }
    } catch (emailError) {
      console.error("[Admin API] Failed to send email:", emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: "Assignment successfully reassigned",
      old_assignment_id: assignment_id,
      new_assignment_id: newAssignment.id,
      new_reviewer: {
        id: newReviewer.id,
        display_id: newReviewer.display_id,
      },
      deadline: newDeadline.toISOString(),
    });
  } catch (error) {
    console.error("[Admin API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
