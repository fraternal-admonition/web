import { createAdminClient } from "@/lib/supabase/server";

export interface AuditEvent {
  user_id: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "VIEW";
  resource_type: "cms_page" | "cms_asset" | "cms_setting" | "contest" | "illustration";
  resource_id: string;
  changes?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Logs an audit event to the database
 * Records admin actions for security and compliance
 */
export async function logAuditEvent(event: AuditEvent): Promise<void> {
  try {
    const supabase = await createAdminClient();

    const { error } = await supabase.from("audit_logs").insert({
      user_id: event.user_id,
      action: event.action,
      resource_type: event.resource_type,
      resource_id: event.resource_id,
      changes: event.changes || null,
      ip_address: event.ip_address || null,
      user_agent: event.user_agent || null,
    });

    if (error) {
      console.error("Failed to log audit event:", error);
      // Don't throw error - audit logging should not break the main operation
    } else {
      console.log(
        `[Audit] ${event.action} ${event.resource_type} ${event.resource_id} by ${event.user_id}`
      );
    }
  } catch (error) {
    console.error("Unexpected error logging audit event:", error);
    // Don't throw error - audit logging should not break the main operation
  }
}

/**
 * Helper to extract IP address from request headers
 */
export function getIPAddress(headers: Headers): string | undefined {
  return (
    headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    headers.get("x-real-ip") ||
    undefined
  );
}

/**
 * Helper to get user agent from request headers
 */
export function getUserAgent(headers: Headers): string | undefined {
  return headers.get("user-agent") || undefined;
}
