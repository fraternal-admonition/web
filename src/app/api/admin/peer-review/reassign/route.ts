import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { sendPeerReviewAssignmentEmail } from "@/lib/email";

/**
 * POST /api/admin/peer-review/reassign
 * Manually reassign a peer review assignment to a different reviewer
 */
export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { assignmentId, newReviewerId, reason } = body;

    if (!assignmentId || !newReviewerId) {
      return NextResponse.json(
        { error: "Assignment ID and new reviewer ID are required" },
        { status: 400 }
      );
    }

    const adminSupabase = await createAdminClient();

    // Fetch the current assignment
    const { data: assignment, error: fetchError } = await adminSupabase
      .from("peer_review_assignments")
      .select("*, submission:submissions(id, contest_id, user_id)")
      .eq("id", assignmentId)
      .single();

    if (fetchError || !assignment) {
      console.error("Error fetching assignment:", fetchError);
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    // Verify new reviewer is not the submission author
    if (newReviewerId === assignment.submission.user_id) {
      return NextResponse.json(
        { error: "Cannot assign reviewer to their own submission" },
        { status: 400 }
      );
    }

    // Check if new reviewer already has an assignment for this submission
    const { data: existingAssignment } = await adminSupabase
      .from("peer_review_assignments")
      .select("id")
      .eq("submission_id", assignment.submission_id)
      .eq("reviewer_user_id", newReviewerId)
      .neq("status", "EXPIRED")
      .single();

    if (existingAssignment) {
      return NextResponse.json(
        { error: "New reviewer already has an assignment for this submission" },
        { status: 400 }
      );
    }

    // Get contest configuration for deadline
    const { data: contest } = await adminSupabase
      .from("contests")
      .select("voting_rules")
      .eq("id", assignment.submission.contest_id)
      .single();

    const votingRules = contest?.voting_rules as any;
    const deadlineDays = votingRules?.peer_review_deadline_days || 7;
    const newDeadline = new Date();
    newDeadline.setDate(newDeadline.getDate() + deadlineDays);

    // Mark old assignment as EXPIRED
    const { error: expireError } = await adminSupabase
      .from("peer_review_assignments")
      .update({ status: "EXPIRED" })
      .eq("id", assignmentId);

    if (expireError) {
      console.error("Error expiring old assignment:", expireError);
      return NextResponse.json(
        { error: "Failed to expire old assignment" },
        { status: 500 }
      );
    }

    // Create new assignment
    const { data: newAssignment, error: createError } = await adminSupabase
      .from("peer_review_assignments")
      .insert({
        submission_id: assignment.submission_id,
        reviewer_user_id: newReviewerId,
        status: "PENDING",
        deadline: newDeadline.toISOString(),
      })
      .select()
      .single();

    if (createError || !newAssignment) {
      console.error("Error creating new assignment:", createError);
      return NextResponse.json(
        { error: "Failed to create new assignment" },
        { status: 500 }
      );
    }

    // Fetch new reviewer details
    const { data: newReviewer } = await adminSupabase
      .from("users")
      .select("email, display_id")
      .eq("id", newReviewerId)
      .single();

    // Send notification email to new reviewer
    if (newReviewer?.email) {
      try {
        await sendPeerReviewAssignmentEmail(
          newReviewer.email,
          newReviewer.display_id || "Reviewer",
          1, // Single reassignment
          newDeadline
        );
      } catch (emailError) {
        console.error("Error sending reassignment email:", emailError);
        // Don't fail the request if email fails
      }
    }

    // Log the admin action
    console.log(`[Admin] Reassigned assignment ${assignmentId} to reviewer ${newReviewerId}. Reason: ${reason || "Not provided"}`);

    // TODO: Log to audit_logs table if it exists
    // await adminSupabase.from("audit_logs").insert({
    //   action: "peer_review_reassignment",
    //   admin_user_id: adminUser.id,
    //   details: { assignmentId, oldReviewerId: assignment.reviewer_user_id, newReviewerId, reason },
    // });

    return NextResponse.json({
      success: true,
      newAssignment,
    });
  } catch (error) {
    console.error("Error in POST /api/admin/peer-review/reassign:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
