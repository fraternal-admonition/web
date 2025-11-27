import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SubmissionSchema } from "@/lib/security/validators";
import { generateUniqueSubmissionCode } from "@/lib/submissions/submission-code";
import { getSubmissionPhaseStatus } from "@/lib/contests/phase-utils";
import { Contest } from "@/types/contests";
import { rateLimiter } from "@/lib/security/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Rate limiting: 5 submissions per hour per user
    const rateLimitResult = await rateLimiter.checkLimit(
      `submission:${user.id}`,
      5,
      60 * 60 * 1000 // 1 hour
    );

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Too many submission attempts. Please try again later." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": "5",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": rateLimitResult.resetAt.toISOString(),
            "Retry-After": Math.ceil(
              (rateLimitResult.resetAt.getTime() - Date.now()) / 1000
            ).toString(),
          },
        }
      );
    }

    // Get request body
    const body = await request.json();

    // Validate input
    const validation = SubmissionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { contest_id, title, body: letterBody, illustration_id, note } = validation.data;

    // Fetch contest to check phase and max_entries
    const { data: contest, error: contestError } = await supabase
      .from("contests")
      .select("*")
      .eq("id", contest_id)
      .single();

    if (contestError || !contest) {
      return NextResponse.json(
        { error: "Contest not found" },
        { status: 404 }
      );
    }

    // Check if submissions are open
    const phaseStatus = getSubmissionPhaseStatus(contest as Contest);
    if (!phaseStatus.canSubmit) {
      return NextResponse.json(
        { error: "Submissions are not currently open for this contest" },
        { status: 400 }
      );
    }

    // Check max_entries limit if set
    if (contest.max_entries) {
      const { count, error: countError } = await supabase
        .from("submissions")
        .select("id", { count: "exact", head: true })
        .eq("contest_id", contest_id)
        .in("status", ["PENDING_PAYMENT", "SUBMITTED"]);

      if (countError) {
        console.error("[API] Error counting submissions:", countError);
      }

      if (count && count >= contest.max_entries) {
        return NextResponse.json(
          { error: "Maximum number of entries reached for this contest" },
          { status: 400 }
        );
      }
    }

    // Verify illustration exists and is active
    const { data: illustration, error: illustrationError } = await supabase
      .from("illustrations")
      .select("id, is_active")
      .eq("id", illustration_id)
      .eq("contest_id", contest_id)
      .single();

    if (illustrationError || !illustration) {
      return NextResponse.json(
        { error: "Invalid illustration selected" },
        { status: 400 }
      );
    }

    if (!illustration.is_active) {
      return NextResponse.json(
        { error: "Selected illustration is not available" },
        { status: 400 }
      );
    }

    // Generate unique submission code
    const submissionCode = await generateUniqueSubmissionCode(contest_id);

    // Create submission with status PENDING_PAYMENT
    const { data: newSubmission, error: submissionError } = await supabase
      .from("submissions")
      .insert({
        contest_id,
        user_id: user.id,
        submission_code: submissionCode,
        title: title.trim(),
        body_text: letterBody.trim(),
        illustration_id,
        image_note_100: note?.trim() || null,
        status: "PENDING_PAYMENT",
      })
      .select()
      .single();

    if (submissionError) {
      console.error("[API] Error creating submission:", submissionError);

      // Handle specific database errors
      if (submissionError.code === "23505") {
        // Unique constraint violation (submission_code collision - very rare)
        return NextResponse.json(
          { error: "Failed to generate unique submission code. Please try again." },
          { status: 500 }
        );
      }

      if (submissionError.code === "23503") {
        // Foreign key constraint violation
        return NextResponse.json(
          { error: "Invalid contest or illustration reference" },
          { status: 400 }
        );
      }

      throw submissionError;
    }

    console.log(
      `[API] Submission created: ${newSubmission.id} (${submissionCode}) by user ${user.id}`
    );

    return NextResponse.json(
      {
        submission_id: newSubmission.id,
        submission_code: submissionCode,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[API] Error in POST /api/submissions:", error);

    return NextResponse.json(
      {
        error: "Failed to create submission. Please try again.",
      },
      { status: 500 }
    );
  }
}
