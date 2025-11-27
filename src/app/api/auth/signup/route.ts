import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Sign up the user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        data: {
          email_confirmed: false,
        },
      },
    });

    if (error) {
      console.error("Signup error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data.user) {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    // Create public.users profile using admin client to bypass RLS
    const adminClient = await createAdminClient();

    console.log("Attempting to create profile for user:", data.user.id);

    const { data: profileData, error: profileError } = await adminClient
      .from("users")
      .insert({
        id: data.user.id,
        role: "USER",
        is_banned: false,
      })
      .select()
      .single();

    if (profileError) {
      console.error("Profile creation error:", profileError);
      console.error(
        "Profile error details:",
        JSON.stringify(profileError, null, 2)
      );

      // Delete the auth user if profile creation fails
      await supabase.auth.admin.deleteUser(data.user.id);

      return NextResponse.json(
        {
          error: "Failed to create user profile. Please try again.",
          details: profileError.message,
        },
        { status: 500 }
      );
    }

    console.log("Profile created successfully:", profileData);

    // Send welcome email (non-blocking)
    if (data.user.email) {
      console.log("Sending welcome email to new user:", data.user.email);
      sendWelcomeEmail(data.user.email).catch((err) => {
        console.error("Failed to send welcome email:", err);
        // Don't block the response if email fails
      });
    }

    return NextResponse.json(
      {
        message: "Signup successful! Welcome to Fraternal Admonition.",
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Unexpected error during signup:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
