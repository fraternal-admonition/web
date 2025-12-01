import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Sign out error:", error);
      return NextResponse.redirect(new URL("/?error=signout_failed", request.url));
    }

    // Redirect to home page after successful sign out
    return NextResponse.redirect(new URL("/", request.url));
  } catch (error) {
    console.error("Unexpected error during sign out:", error);
    return NextResponse.redirect(new URL("/?error=signout_error", request.url));
  }
}
