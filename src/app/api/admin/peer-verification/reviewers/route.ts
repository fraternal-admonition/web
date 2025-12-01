import { NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  // Check admin authentication
  const authResult = await checkAdminAuth();
  if (!authResult.authorized) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  try {
    const supabase = await createAdminClient();

    // First get all peer_assignments to find reviewers
    const { data: assignments } = await supabase
      .from("peer_assignments")
      .select("reviewer_user_id, id, status, assigned_at, deadline, completed_at");

    if (!assignments || assignments.length === 0) {
      return NextResponse.json({
        reviewers: [],
        stats: {
          total: 0,
          qualified: 0,
          flagged: 0,
          averageIntegrityScore: 0,
          averageCompletionRate: 0,
        },
      });
    }

    // Get unique reviewer IDs
    const reviewerIds = [...new Set(assignments.map(a => a.reviewer_user_id))];

    // Fetch reviewer data
    const { data: reviewers, error } = await supabase
      .from("users")
      .select("id, display_id, integrity_score, qualified_evaluator")
      .in("id", reviewerIds)
      .order("integrity_score", { ascending: false });

    if (error) {
      console.error("[Admin API] Error fetching reviewers:", error);
      return NextResponse.json(
        { error: "Failed to fetch reviewers" },
        { status: 500 }
      );
    }

    // Group assignments by reviewer
    const assignmentsByReviewer = new Map<string, any[]>();
    assignments.forEach(assignment => {
      const existing = assignmentsByReviewer.get(assignment.reviewer_user_id) || [];
      assignmentsByReviewer.set(assignment.reviewer_user_id, [...existing, assignment]);
    });

    // Attach assignments to reviewers
    const reviewersWithAssignments = reviewers?.map(reviewer => ({
      ...reviewer,
      peer_assignments: assignmentsByReviewer.get(reviewer.id) || []
    })) || [];

    // Calculate metrics for each reviewer
    const reviewersWithMetrics = reviewersWithAssignments.map((reviewer) => {
      const assignments = reviewer.peer_assignments || [];
      const totalAssignments = assignments.length;
      const completedAssignments = assignments.filter(
        (a: any) => a.status === "DONE"
      ).length;
      const expiredAssignments = assignments.filter(
        (a: any) => a.status === "EXPIRED"
      ).length;
      const pendingAssignments = assignments.filter(
        (a: any) => a.status === "PENDING"
      ).length;
      const completionRate =
        totalAssignments > 0
          ? Math.round((completedAssignments / totalAssignments) * 100)
          : 0;

      return {
        id: reviewer.id,
        display_id: reviewer.display_id,
        integrity_score: reviewer.integrity_score || 0,
        qualified_evaluator: reviewer.qualified_evaluator || false,
        totalAssignments,
        completedAssignments,
        expiredAssignments,
        pendingAssignments,
        completionRate,
        isFlagged: (reviewer.integrity_score || 0) < 0,
      };
    });

    // Calculate aggregated stats
    const stats = {
      total: reviewersWithMetrics.length,
      qualified: reviewersWithMetrics.filter((r) => r.qualified_evaluator)
        .length,
      flagged: reviewersWithMetrics.filter((r) => r.isFlagged).length,
      averageIntegrityScore:
        reviewersWithMetrics.length > 0
          ? Math.round(
              reviewersWithMetrics.reduce(
                (sum, r) => sum + r.integrity_score,
                0
              ) / reviewersWithMetrics.length
            )
          : 0,
      averageCompletionRate:
        reviewersWithMetrics.length > 0
          ? Math.round(
              reviewersWithMetrics.reduce((sum, r) => sum + r.completionRate, 0) /
                reviewersWithMetrics.length
            )
          : 0,
    };

    return NextResponse.json({
      reviewers: reviewersWithMetrics,
      stats,
    });
  } catch (error) {
    console.error("[Admin API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
