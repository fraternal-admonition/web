import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { processPeerReviewPhaseEnd } from "@/lib/peer-review/phase-end-service";

/**
 * POST /api/admin/peer-review/end-phase
 * End the peer review phase and transition to public voting
 */
export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { contestId } = body;

    if (!contestId) {
      return NextResponse.json(
        { error: "Contest ID is required" },
        { status: 400 }
      );
    }

    console.log(`[Admin] Ending peer review phase for contest ${contestId}`);

    // Process phase end
    const result = await processPeerReviewPhaseEnd(contestId);

    console.log(`[Admin] Peer review phase ended successfully:`, result);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error in POST /api/admin/peer-review/end-phase:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
