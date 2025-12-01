import { createClient, createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userData?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch contest
    const { data: contest, error } = await supabase
      .from("contests")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !contest) {
      return NextResponse.json(
        { error: "Contest not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ contest });
  } catch (error) {
    console.error("Error fetching contest:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userData?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // Check if phase is being updated to PEER_REVIEW
    const isChangingToPeerReview = body.phase === 'PEER_REVIEW';
    
    // Get current phase before update to check if it's actually changing
    let oldPhase = null;
    if (isChangingToPeerReview) {
      const adminSupabase = await createAdminClient();
      const { data: currentContest } = await adminSupabase
        .from('contests')
        .select('phase')
        .eq('id', id)
        .single();
      oldPhase = currentContest?.phase;
    }

    // Use admin client for update to bypass RLS
    const adminSupabase = await createAdminClient();
    const { data: contest, error } = await adminSupabase
      .from("contests")
      .update(body)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating contest:", error);
      return NextResponse.json(
        { error: "Failed to update contest" },
        { status: 500 }
      );
    }

    // If phase changed TO PEER_REVIEW (not if already PEER_REVIEW), trigger assignments
    if (isChangingToPeerReview && oldPhase !== 'PEER_REVIEW') {
      console.log('🚀 Triggering peer review assignments for contest:', id);
      
      // Import and execute assignment service
      const { executePeerReviewAssignments } = await import('@/lib/peer-review/assignment-service');
      
      // Run asynchronously (don't block the response)
      executePeerReviewAssignments(id, 10, 7)
        .then(result => {
          console.log('✅ Peer review assignments created:', result);
        })
        .catch(error => {
          console.error('❌ Error creating peer review assignments:', error);
        });
    }

    return NextResponse.json({ contest });
  } catch (error) {
    console.error("Error updating contest:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userData?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Use admin client for delete to bypass RLS
    const adminSupabase = await createAdminClient();
    const { error } = await adminSupabase
      .from("contests")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting contest:", error);
      return NextResponse.json(
        { error: "Failed to delete contest" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting contest:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
