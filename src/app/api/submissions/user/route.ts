import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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

    // Fetch all submissions for the authenticated user
    const { data: submissions, error: submissionsError } = await supabase
      .from("submissions")
      .select(`
        *,
        illustration:illustrations(
          id,
          title,
          asset:cms_assets(path, alt)
        ),
        contest:contests(
          id,
          title,
          submissions_close_at,
          phase
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (submissionsError) {
      console.error("[API] Error fetching user submissions:", submissionsError);
      throw submissionsError;
    }

    return NextResponse.json({
      data: submissions || [],
    });
  } catch (error) {
    console.error("[API] Error in GET /api/submissions/user:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch submissions. Please try again.",
      },
      { status: 500 }
    );
  }
}
