import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { sendWelcomeEmail } from "@/lib/email";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();

    // Exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Error exchanging code for session:", error);
      return NextResponse.redirect(new URL("/auth/auth-error", origin));
    }

    if (data.user) {
      // Check if user already has a public.users profile
      const adminClient = await createAdminClient();
      const { data: existingProfile, error: profileCheckError } =
        await adminClient
          .from("users")
          .select("id")
          .eq("id", data.user.id)
          .single();

      console.log("OAuth callback - checking profile for user:", data.user.id);
      console.log("Existing profile:", existingProfile);
      console.log("Profile check error:", profileCheckError);

      // Create profile if it doesn't exist (for OAuth users)
      // Note: If no profile exists, profileCheckError will be "PGRST116" (not found), which is expected
      if (!existingProfile) {
        console.log("Creating profile for OAuth user:", data.user.id);

        const { data: newProfile, error: profileError } = await adminClient
          .from("users")
          .insert({
            id: data.user.id,
            role: "USER",
            is_banned: false,
          })
          .select()
          .single();

        if (profileError) {
          console.error("Error creating user profile for OAuth:", profileError);
          console.error(
            "Profile error details:",
            JSON.stringify(profileError, null, 2)
          );
          // Continue anyway - profile can be created later
        } else {
          console.log("Profile created successfully:", newProfile);
        }
      } else {
        console.log("Profile already exists for user:", data.user.id);
      }

      // Send welcome email after successful verification (non-blocking)
      if (data.user.email) {
        sendWelcomeEmail(data.user.email).catch((err) => {
          console.error("Failed to send welcome email:", err);
          // Don't block the redirect if email fails
        });
      }

      // Redirect to next URL
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  // Return the user to an error page with some instructions
  return NextResponse.redirect(new URL("/auth/auth-error", origin));
}
