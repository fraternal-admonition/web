import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { calculatePeerScore } from "@/lib/peer-review/scoring-service";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * POST /api/admin/peer-review/override-score
 * Manually override individual review scores
 */
export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { reviewId, clarity, argument, style, moral_depth, justification } = body;

    if (!reviewId || !justification) {
      return NextResponse.json(
        { error: "Review ID and justification are required" },
        { status: 400 }
      );
    }

    // Validate scores are between 1 and 5
    const scores = [clarity, argument, style, moral_depth];
    if (scores.some(s => s !== undefined && (s < 1 || s > 5))) {
      return NextResponse.json(
        { error: "Scores must be between 1 and 5" },
        { status: 400 }
      );
    }

    const adminSupabase = await createAdminClient();

    // Fetch the review and related data
    const { data: review, error: fetchError } = await adminSupabase
      .from("peer_review_reviews")
      .select(`
        *,
        assignment:peer_review_assignments(
          id,
          submission_id,
          submission:submissions(
            id,
            user_id,
            submission_code,
            contest_id,
            user:users(email, display_id)
          )
        )
      `)
      .eq("id", reviewId)
      .single();

    if (fetchError || !review) {
      console.error("Error fetching review:", fetchError);
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    // Build update object with only provided scores
    const updateData: any = {};
    if (clarity !== undefined) updateData.clarity = clarity;
    if (argument !== undefined) updateData.argument = argument;
    if (style !== undefined) updateData.style = style;
    if (moral_depth !== undefined) updateData.moral_depth = moral_depth;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "At least one score must be provided" },
        { status: 400 }
      );
    }

    // Update the review
    const { error: updateError } = await adminSupabase
      .from("peer_review_reviews")
      .update(updateData)
      .eq("id", reviewId);

    if (updateError) {
      console.error("Error updating review:", updateError);
      return NextResponse.json(
        { error: "Failed to update review" },
        { status: 500 }
      );
    }

    // Recalculate submission peer score
    const submissionId = review.assignment.submission_id;
    try {
      await calculatePeerScore(submissionId);
    } catch (scoreError) {
      console.error("Error recalculating peer score:", scoreError);
      // Don't fail the request if score calculation fails
    }

    // Log the admin action
    console.log(`[Admin] Override review ${reviewId} scores. Justification: ${justification}`);
    console.log(`[Admin] Updated scores:`, updateData);

    // TODO: Log to audit_logs table if it exists
    // await adminSupabase.from("audit_logs").insert({
    //   action: "peer_review_score_override",
    //   admin_user_id: adminUser.id,
    //   details: { reviewId, submissionId, oldScores: { ... }, newScores: updateData, justification },
    // });

    // Send notification email to submission author
    const author = review.assignment.submission.user;
    if (author?.email) {
      try {
        await resend.emails.send({
          from: "Fraternal Admonition <noreply@fraternaladmonition.com>",
          to: author.email,
          subject: "Peer Review Score Updated",
          html: `
            <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #222; font-size: 24px; margin-bottom: 20px;">
                Peer Review Score Updated
              </h1>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                Dear ${author.display_id || "Author"},
              </p>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                An administrator has updated one of the peer review scores for your submission 
                <strong>${review.assignment.submission.submission_code}</strong>.
              </p>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                <strong>Reason:</strong> ${justification}
              </p>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                Your overall peer score has been recalculated. You can view your updated results 
                in your dashboard.
              </p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #E5E5E0;">
                <p style="color: #999; font-size: 12px; line-height: 1.4;">
                  Fraternal Admonition<br>
                  Letters to Goliath Contest
                </p>
              </div>
            </div>
          `,
        });
      } catch (emailError) {
        console.error("Error sending notification email:", emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: "Review scores updated and peer score recalculated",
    });
  } catch (error) {
    console.error("Error in POST /api/admin/peer-review/override-score:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
