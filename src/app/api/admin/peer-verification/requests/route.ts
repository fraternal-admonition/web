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

    // Fetch all verification requests with assignments
    const { data: requests, error } = await supabase
      .from("submissions")
      .select(
        `
        id,
        submission_code,
        title,
        status,
        created_at,
        updated_at,
        peer_verification_result,
        user_id,
        peer_assignments(
          id,
          status,
          assigned_at,
          deadline,
          completed_at,
          reviewer_user_id
        )
      `
      )
      .or("status.eq.PEER_VERIFICATION_PENDING,status.eq.REINSTATED,and(status.eq.ELIMINATED,peer_verification_result.not.is.null)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Admin API] Error fetching verification requests:", error);
      return NextResponse.json(
        { error: "Failed to fetch verification requests" },
        { status: 500 }
      );
    }

    // Fetch user display IDs separately
    const userIds = requests?.map(r => r.user_id).filter(Boolean) || [];
    const reviewerIds = requests?.flatMap(r => 
      r.peer_assignments?.map((a: any) => a.reviewer_user_id) || []
    ).filter(Boolean) || [];
    
    const allUserIds = [...new Set([...userIds, ...reviewerIds])];
    
    const { data: users } = await supabase
      .from("users")
      .select("id, display_id")
      .in("id", allUserIds);

    const usersMap = new Map(users?.map(u => [u.id, u]) || []);

    // Map users to requests
    const requestsWithUsers = requests?.map(req => {
      const user = usersMap.get(req.user_id);
      return {
        ...req,
        user: {
          id: req.user_id,
          display_id: user?.display_id || req.user_id?.substring(0, 8) || "Unknown"
        },
        peer_assignments: req.peer_assignments?.map((a: any) => {
          const reviewer = usersMap.get(a.reviewer_user_id);
          return {
            ...a,
            reviewer: {
              id: a.reviewer_user_id,
              display_id: reviewer?.display_id || a.reviewer_user_id?.substring(0, 8) || "Unknown"
            }
          };
        })
      };
    }) || [];

    // Calculate aggregated stats
    const stats = {
      total: requestsWithUsers?.length || 0,
      completed:
        requestsWithUsers?.filter(
          (req) =>
            req.peer_assignments?.filter((a: any) => a.status === "DONE")
              .length >= 10
        ).length || 0,
      pending:
        requestsWithUsers?.filter(
          (req) =>
            req.peer_assignments?.filter((a: any) => a.status === "DONE")
              .length < 10
        ).length || 0,
      totalAssignments: requestsWithUsers?.reduce(
        (sum, req) => sum + (req.peer_assignments?.length || 0),
        0
      ),
      completedAssignments: requestsWithUsers?.reduce(
        (sum, req) =>
          sum +
          (req.peer_assignments?.filter((a: any) => a.status === "DONE")
            .length || 0),
        0
      ),
      expiredAssignments: requestsWithUsers?.reduce(
        (sum, req) =>
          sum +
          (req.peer_assignments?.filter((a: any) => a.status === "EXPIRED")
            .length || 0),
        0
      ),
    };

    return NextResponse.json({
      requests: requestsWithUsers || [],
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
