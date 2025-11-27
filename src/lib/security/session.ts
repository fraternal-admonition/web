import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const SESSION_TIMEOUT_MINUTES = 30;

export interface SessionResult {
  valid: boolean;
  user?: any;
  error?: string;
}

/**
 * Validates an admin session
 * Checks if the session is still valid and not expired
 */
export async function validateAdminSession(
  request: NextRequest
): Promise<SessionResult> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return {
        valid: false,
        error: "Session invalid or expired",
      };
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from("users")
      .select("role, is_banned")
      .eq("id", user.id)
      .single();

    if (!userData || userData.role !== "ADMIN" || userData.is_banned) {
      return {
        valid: false,
        error: "Not authorized",
      };
    }

    return {
      valid: true,
      user,
    };
  } catch (error) {
    console.error("Session validation error:", error);
    return {
      valid: false,
      error: "Session validation failed",
    };
  }
}

/**
 * Extends the session timeout
 * Called on user activity to keep session alive
 */
export async function extendSession(userId: string): Promise<void> {
  // Supabase handles session extension automatically
  // This function is a placeholder for future custom session management
  console.log(`[extendSession] Session extended for user ${userId}`);
}

/**
 * Invalidates a session
 * Called on sign-out to immediately invalidate the session
 */
export async function invalidateSession(userId: string): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
    console.log(`[invalidateSession] Session invalidated for user ${userId}`);
  } catch (error) {
    console.error("Failed to invalidate session:", error);
  }
}
