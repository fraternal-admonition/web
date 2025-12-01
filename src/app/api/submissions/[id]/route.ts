import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
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

    // Fetch submission with related data
    const { data: submission, error: submissionError } = await supabase
      .from("submissions")
      .select(`
        *,
        illustration:illustrations(
          id,
          title,
          description,
          asset:cms_assets(path, alt)
        ),
        contest:contests(
          id,
          title,
          submissions_close_at,
          phase
        )
      `)
      .eq("id", id)
      .single();

    if (submissionError) {
      if (submissionError.code === "PGRST116") {
        // Not found
        return NextResponse.json(
          { error: "Submission not found" },
          { status: 404 }
        );
      }
      console.error("[API] Error fetching submission:", submissionError);
      throw submissionError;
    }

    // Verify ownership
    if (submission.user_id !== user.id) {
      return NextResponse.json(
        { error: "You do not have permission to view this submission" },
        { status: 403 }
      );
    }

    // Fetch payment information if exists
    const { data: payment } = await supabase
      .from("payments")
      .select("*")
      .eq("submission_id", id)
      .eq("purpose", "ENTRY_FEE")
      .maybeSingle();

    return NextResponse.json({
      data: {
        ...submission,
        payment: payment || null,
      },
    });
  } catch (error) {
    console.error("[API] Error in GET /api/submissions/[id]:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch submission. Please try again.",
      },
      { status: 500 }
    );
  }
}
