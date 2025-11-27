import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface AdminAuthResult {
  user: any;
  userData: {
    role: string;
    is_banned: boolean;
  };
}

export interface AuthCheckResult {
  authorized: boolean;
  user?: any;
  userData?: {
    role: string;
    is_banned: boolean;
  };
  error?: string;
  status?: number;
}

/**
 * Check if the current user is an admin
 * Redirects to signin if not authenticated or to appropriate page if not admin
 * 
 * @param redirectTo - Optional path to redirect to after signin (defaults to /admin)
 * @returns Object containing user and userData
 */
export async function requireAdmin(redirectTo?: string): Promise<AdminAuthResult> {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  // Not authenticated - redirect to signin with redirect parameter
  if (!user || userError) {
    const targetPath = redirectTo || "/admin";
    const signinUrl = `/auth/signin?redirect=${encodeURIComponent(targetPath)}`;
    
    console.log(`[requireAdmin] No user found, redirecting to signin`);
    redirect(signinUrl);
  }

  // Fetch user profile data
  const { data: userData, error: profileError } = await supabase
    .from("users")
    .select("role, is_banned")
    .eq("id", user.id)
    .single();

  // Handle profile fetch errors
  if (profileError || !userData) {
    console.error(
      `[requireAdmin] Failed to fetch user data for ${user.id}:`,
      profileError
    );
    redirect("/");
  }

  // Check if user is banned
  if (userData.is_banned) {
    console.log(`[requireAdmin] User ${user.id} is banned`);
    redirect("/auth/banned");
  }

  // Check if user is admin
  if (userData.role !== "ADMIN") {
    console.log(
      `[requireAdmin] User ${user.id} is not admin (role: ${userData.role})`
    );
    redirect("/dashboard");
  }

  // User is authenticated and is an admin
  console.log(`[requireAdmin] Admin access granted for ${user.id}`);
  
  return { user, userData };
}

/**
 * Check admin authentication for API routes
 * Returns structured result instead of redirecting
 * 
 * @returns AuthCheckResult with authorization status and user data
 */
export async function checkAdminAuth(): Promise<AuthCheckResult> {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (!user || userError) {
      console.log(`[checkAdminAuth] No user found`);
      return {
        authorized: false,
        status: 401,
        error: "Unauthorized",
      };
    }

    // Fetch user profile data
    const { data: userData, error: profileError } = await supabase
      .from("users")
      .select("role, is_banned")
      .eq("id", user.id)
      .single();

    if (profileError || !userData) {
      console.error(
        `[checkAdminAuth] Failed to fetch user data for ${user.id}:`,
        profileError
      );
      return {
        authorized: false,
        status: 403,
        error: "Forbidden",
      };
    }

    // Check if user is banned
    if (userData.is_banned) {
      console.log(`[checkAdminAuth] User ${user.id} is banned`);
      return {
        authorized: false,
        status: 403,
        error: "Account banned",
      };
    }

    // Check if user is admin
    if (userData.role !== "ADMIN") {
      console.log(
        `[checkAdminAuth] User ${user.id} is not admin (role: ${userData.role})`
      );
      return {
        authorized: false,
        status: 403,
        error: "Forbidden",
      };
    }

    // User is authenticated and is an admin
    console.log(`[checkAdminAuth] Admin access granted for ${user.id}`);

    return {
      authorized: true,
      user,
      userData,
    };
  } catch (error) {
    console.error(`[checkAdminAuth] Unexpected error:`, error);
    return {
      authorized: false,
      status: 500,
      error: "Internal server error",
    };
  }
}
