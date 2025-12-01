import { createClient, createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
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

    // Use admin client to bypass RLS
    const adminSupabase = await createAdminClient();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const contestId = searchParams.get("contest_id");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    console.log("Admin submissions query params:", {
      status,
      contestId,
      search,
      page,
      limit,
    });

    // Build query
    let query = adminSupabase
      .from("submissions")
      .select(
        `
        *,
        contest:contests(id, title),
        ai_screenings(id, status, phase, created_at)
      `,
        { count: "exact" }
      );

    // Apply filters
    if (status) {
      // Handle AI screening status filters
      if (status === 'AI_PASSED') {
        // Filter by ai_screenings.status = 'PASSED'
        // Note: This requires a different approach since we can't filter on joined tables directly
        // We'll handle this after fetching
      } else if (status === 'AI_FAILED') {
        // Filter by ai_screenings.status = 'FAILED'
      } else if (status === 'AI_REVIEW') {
        // Filter by ai_screenings.status = 'REVIEW'
      } else {
        // Regular submission status filter
        query = query.eq("status", status);
      }
    }

    if (contestId) {
      query = query.eq("contest_id", contestId);
    }

    if (search) {
      query = query.or(
        `submission_code.ilike.%${search}%,title.ilike.%${search}%`
      );
    }

    // Apply pagination and ordering
    query = query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    let { data: submissions, error, count } = await query;

    console.log("Query result:", {
      submissionsCount: submissions?.length || 0,
      totalCount: count,
      error: error?.message,
    });

    if (error) {
      console.error("Error fetching submissions:", error);
      return NextResponse.json(
        { error: "Failed to fetch submissions" },
        { status: 500 }
      );
    }

    // Filter by AI screening status if needed (post-query filtering)
    if (status && ['AI_PASSED', 'AI_FAILED', 'AI_REVIEW'].includes(status)) {
      const aiStatus = status.replace('AI_', '');
      submissions = submissions?.filter(s => 
        s.ai_screenings && s.ai_screenings.length > 0 && s.ai_screenings[0].status === aiStatus
      ) || [];
      count = submissions.length;
    }

    // Fetch user emails and flags from auth.users
    if (submissions && submissions.length > 0) {
      const userIds = [...new Set(submissions.map(s => s.user_id))];
      const submissionIds = submissions.map(s => s.id);
      
      // Fetch emails for all users
      const emailPromises = userIds.map(async (userId) => {
        const { data: authUser } = await adminSupabase.auth.admin.getUserById(userId);
        return { id: userId, email: authUser?.user?.email || "Unknown" };
      });
      
      const userEmails = await Promise.all(emailPromises);
      const userMap = new Map(userEmails.map(u => [u.id, u.email]));

      // Fetch flags for all submissions (polymorphic relationship)
      const { data: flags } = await adminSupabase
        .from('flags')
        .select('*')
        .eq('entity_type', 'SUBMISSION')
        .in('entity_id', submissionIds);

      // Create a map of submission_id -> flags
      const flagsMap = new Map<string, any[]>();
      flags?.forEach(flag => {
        if (!flagsMap.has(flag.entity_id)) {
          flagsMap.set(flag.entity_id, []);
        }
        flagsMap.get(flag.entity_id)!.push(flag);
      });

      // Add user email and flags to each submission
      submissions.forEach(submission => {
        submission.user = {
          email: userMap.get(submission.user_id) || "Unknown"
        };
        submission.flags = flagsMap.get(submission.id) || [];
      });
    }

    return NextResponse.json({
      submissions,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error("Error in admin submissions route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
