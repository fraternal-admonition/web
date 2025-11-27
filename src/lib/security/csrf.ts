import { nanoid } from "nanoid";
import { createAdminClient } from "@/lib/supabase/server";

const TOKEN_EXPIRY_MINUTES = 60;

/**
 * Generates a CSRF token for a user
 * Tokens are stored in the database and expire after 60 minutes
 */
export async function generateCSRFToken(userId: string): Promise<string> {
  const token = nanoid(32);
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);

  const supabase = await createAdminClient();

  // Store token in database
  const { error } = await supabase.from("csrf_tokens").insert({
    user_id: userId,
    token,
    expires_at: expiresAt.toISOString(),
  });

  if (error) {
    console.error("Failed to store CSRF token:", error);
    throw new Error("Failed to generate CSRF token");
  }

  return token;
}

/**
 * Validates a CSRF token for a user
 * Returns true if token is valid and not expired
 */
export async function validateCSRFToken(
  token: string,
  userId: string
): Promise<boolean> {
  if (!token || !userId) {
    return false;
  }

  const supabase = await createAdminClient();

  // Find token in database
  const { data, error } = await supabase
    .from("csrf_tokens")
    .select("*")
    .eq("token", token)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return false;
  }

  // Check if token is expired
  const expiresAt = new Date(data.expires_at);
  if (expiresAt < new Date()) {
    // Delete expired token
    await supabase.from("csrf_tokens").delete().eq("id", data.id);
    return false;
  }

  return true;
}
