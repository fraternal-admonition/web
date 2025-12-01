import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/peer-review/config
 * Fetch peer review configuration for a contest
 */
export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const contestId = searchParams.get("contestId");

    if (!contestId) {
      return NextResponse.json(
        { error: "Contest ID is required" },
        { status: 400 }
      );
    }

    const adminSupabase = await createAdminClient();

    // Fetch contest with voting_rules
    const { data: contest, error } = await adminSupabase
      .from("contests")
      .select("voting_rules")
      .eq("id", contestId)
      .single();

    if (error || !contest) {
      console.error("Error fetching contest:", error);
      return NextResponse.json(
        { error: "Contest not found" },
        { status: 404 }
      );
    }

    // Extract peer review config from voting_rules
    const votingRules = contest.voting_rules as any;
    const config = {
      deadlineDays: votingRules.peer_review_deadline_days || 7,
      finalistCount: votingRules.peer_review_finalist_count || 100,
      resultsVisible: votingRules.peer_review_results_visible || false,
    };

    return NextResponse.json(config);
  } catch (error) {
    console.error("Error in GET /api/admin/peer-review/config:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/peer-review/config
 * Update peer review configuration for a contest
 */
export async function PUT(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { contestId, deadlineDays, finalistCount, resultsVisible } = body;

    if (!contestId) {
      return NextResponse.json(
        { error: "Contest ID is required" },
        { status: 400 }
      );
    }

    const adminSupabase = await createAdminClient();

    // Fetch current voting_rules
    const { data: contest, error: fetchError } = await adminSupabase
      .from("contests")
      .select("voting_rules")
      .eq("id", contestId)
      .single();

    if (fetchError || !contest) {
      console.error("Error fetching contest:", fetchError);
      return NextResponse.json(
        { error: "Contest not found" },
        { status: 404 }
      );
    }

    // Update voting_rules with new config
    const votingRules = contest.voting_rules as any;
    const updatedVotingRules = {
      ...votingRules,
      ...(deadlineDays !== undefined && { peer_review_deadline_days: deadlineDays }),
      ...(finalistCount !== undefined && { peer_review_finalist_count: finalistCount }),
      ...(resultsVisible !== undefined && { peer_review_results_visible: resultsVisible }),
    };

    // Update contest
    const { error: updateError } = await adminSupabase
      .from("contests")
      .update({
        voting_rules: updatedVotingRules,
        updated_at: new Date().toISOString(),
      })
      .eq("id", contestId);

    if (updateError) {
      console.error("Error updating contest:", updateError);
      return NextResponse.json(
        { error: "Failed to update configuration" },
        { status: 500 }
      );
    }

    // Log the configuration change
    console.log(`[Admin] Peer review config updated for contest ${contestId}:`, {
      deadlineDays,
      finalistCount,
      resultsVisible,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in PUT /api/admin/peer-review/config:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
