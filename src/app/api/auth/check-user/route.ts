import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const adminClient = await createAdminClient();
    const { data: userData, error: userError } = await adminClient
      .from("users")
      .select("is_banned, role")
      .eq("id", userId)
      .single();

    if (userError) {
      console.error("Error fetching user data:", userError);
      return NextResponse.json(
        { error: "Failed to fetch user data" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        banned: userData?.is_banned || false,
        role: userData?.role || "USER",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error checking user:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
