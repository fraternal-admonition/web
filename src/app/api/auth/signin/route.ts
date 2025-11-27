import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Sign in error:", error);
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (!data.user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Check if user is banned using admin client
    const { createAdminClient } = await import("@/lib/supabase/server");
    const adminClient = await createAdminClient();
    const { data: userData, error: userError } = await adminClient
      .from("users")
      .select("is_banned, role")
      .eq("id", data.user.id)
      .single();

    if (userError) {
      console.error("Error fetching user data:", userError);
    }

    if (userData?.is_banned) {
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: "Your account has been banned. Please contact support." },
        { status: 403 }
      );
    }

    // Check if email is verified
    if (!data.user.email_confirmed_at) {
      return NextResponse.json(
        {
          error: "Please verify your email before signing in.",
          needsVerification: true,
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        message: "Sign in successful",
        user: {
          id: data.user.id,
          email: data.user.email,
          role: userData?.role || "USER",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error during sign in:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
