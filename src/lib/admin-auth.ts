import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Check if the current user is an admin
 * Redirects to signin if not authenticated or to home if not admin
 */
export async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/signin?redirect=/admin");
  }

  // Check user role (using regular client since we're just reading our own role)
  const { data: userData } = await supabase
    .from("users")
    .select("role, is_banned")
    .eq("id", user.id)
    .single();

  if (!userData || userData.is_banned) {
    redirect("/");
  }

  if (userData.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return { user, userData };
}
