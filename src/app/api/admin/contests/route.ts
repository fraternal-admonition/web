import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { checkAdminAuth } from "@/lib/admin-auth";
import { ContestSchema } from "@/lib/security/validators";
import { logAuditEvent, getIPAddress, getUserAgent } from "@/lib/security/audit-log";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const auth = await checkAdminAuth();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Use admin client to bypass RLS
    const adminSupabase = await createAdminClient();

    // Fetch all contests with submission counts
    const { data: contests, error } = await adminSupabase
      .from("contests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    // Get submission counts for each contest
    const contestsWithCounts = await Promise.all(
      (contests || []).map(async (contest) => {
        const { count } = await adminSupabase
          .from("submissions")
          .select("id", { count: "exact", head: true })
          .eq("contest_id", contest.id);

        return {
          ...contest,
          submission_count: count || 0,
        };
      })
    );

    return NextResponse.json({ data: contestsWithCounts });
  } catch (error) {
    console.error("[API] Error fetching contests:", error);
    
    // Log detailed error for debugging
    if (error instanceof Error) {
      console.error("[API] Error details:", {
        message: error.message,
        stack: error.stack,
      });
    }
    
    return NextResponse.json(
      { 
        error: "Failed to fetch contests. Please try again or contact support if the issue persists." 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const auth = await checkAdminAuth();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Get request body
    const body = await request.json();

    // Validate input
    const validation = ContestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.issues },
        { status: 400 }
      );
    }

    const {
      title,
      slug,
      submissions_open_at,
      submissions_close_at,
      ai_filter_start_at,
      ai_filter_end_at,
      peer_start_at,
      peer_end_at,
      public_start_at,
      public_end_at,
      max_entries,
    } = validation.data;

    // Use admin client to bypass RLS
    const adminSupabase = await createAdminClient();

    // Check if slug already exists (if slug is provided)
    if (slug) {
      const { data: existingContest } = await adminSupabase
        .from("contests")
        .select("id")
        .eq("slug", slug)
        .single();

      if (existingContest) {
        return NextResponse.json(
          { error: "A contest with this slug already exists" },
          { status: 400 }
        );
      }
    }

    // Create the contest with default phase 'SUBMISSIONS_OPEN'
    const { data: newContest, error } = await adminSupabase
      .from("contests")
      .insert({
        title,
        slug: slug || null,
        phase: "SUBMISSIONS_OPEN",
        submissions_open_at: submissions_open_at || null,
        submissions_close_at: submissions_close_at || null,
        ai_filter_start_at: ai_filter_start_at || null,
        ai_filter_end_at: ai_filter_end_at || null,
        peer_start_at: peer_start_at || null,
        peer_end_at: peer_end_at || null,
        public_start_at: public_start_at || null,
        public_end_at: public_end_at || null,
        max_entries: max_entries || null,
      })
      .select()
      .single();

    if (error) {
      console.error("[API] Database error creating contest:", error);
      
      // Handle specific database errors
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { error: "A contest with this slug already exists" },
          { status: 400 }
        );
      }
      
      if (error.code === '23503') { // Foreign key constraint violation
        return NextResponse.json(
          { error: "Invalid reference to related data" },
          { status: 400 }
        );
      }
      
      throw error;
    }

    // Log audit event
    await logAuditEvent({
      user_id: auth.user!.id,
      action: "CREATE",
      resource_type: "contest",
      resource_id: newContest.id,
      changes: { title, slug, phase: "SUBMISSIONS_OPEN" },
      ip_address: getIPAddress(request.headers),
      user_agent: getUserAgent(request.headers),
    });

    return NextResponse.json({ data: newContest }, { status: 201 });
  } catch (error) {
    console.error("[API] Error creating contest:", error);
    
    // Log detailed error for debugging
    if (error instanceof Error) {
      console.error("[API] Error details:", {
        message: error.message,
        stack: error.stack,
      });
    }
    
    return NextResponse.json(
      { 
        error: "Failed to create contest. Please check your input and try again." 
      },
      { status: 500 }
    );
  }
}
