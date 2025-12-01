import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { checkAdminAuth } from "@/lib/admin-auth";
import { validateSettingValue, getSettingByKey } from "@/lib/cms/settings-service";
import { SETTINGS_SCHEMA } from "@/lib/cms/settings-schema";
import { logAuditEvent, getIPAddress, getUserAgent } from "@/lib/security/audit-log";
import { settingsCache } from "@/lib/cms/settings-cache";
import { hashPassword } from "@/lib/security/password-hash";
import { invalidateAllPasswordSessions } from "@/lib/security/site-lock-session";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const auth = await checkAdminAuth();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { key } = await params;
    const body = await request.json();
    let { value } = body;

    // Special handling for site_lock_password_hash
    // Admin sends plain text password, we hash it server-side
    if (key === 'site_lock_password_hash') {
      if (typeof value !== 'string') {
        return NextResponse.json(
          { error: 'Password must be a string' },
          { status: 400 }
        );
      }

      if (value.length < 8) {
        return NextResponse.json(
          { error: 'Password must be at least 8 characters' },
          { status: 400 }
        );
      }

      if (value.length > 128) {
        return NextResponse.json(
          { error: 'Password must not exceed 128 characters' },
          { status: 400 }
        );
      }

      // Hash the password
      console.log('[Settings API] Hashing site lock password');
      value = await hashPassword(value);
      console.log('[Settings API] Password hashed successfully');
    }

    // Find setting definition in schema
    const definition = SETTINGS_SCHEMA.find(s => s.key === key);
    if (!definition) {
      return NextResponse.json(
        { error: 'Setting not found in schema' },
        { status: 404 }
      );
    }

    // Validate the value against schema (skip for password hash since it's already hashed)
    if (key !== 'site_lock_password_hash') {
      const validation = validateSettingValue(definition, value);
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error || 'Validation failed' },
          { status: 400 }
        );
      }
    }

    const adminSupabase = await createAdminClient();

    // Get old setting value for audit log and mode change detection
    const oldSetting = await getSettingByKey(key);
    const oldMode = key === 'site_lock_mode' ? oldSetting?.value : null;

    // Upsert the setting (insert if not exists, update if exists)
    const { data: updatedSetting, error } = await adminSupabase
      .from("cms_settings")
      .upsert(
        {
          key,
          value_json: value,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'key',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    // Invalidate password sessions if password changed
    if (key === 'site_lock_password_hash') {
      console.log('[Settings API] Password changed, invalidating all password sessions');
      invalidateAllPasswordSessions();
    }

    // Invalidate password sessions if switching away from password mode
    if (key === 'site_lock_mode' && oldMode === 'password' && value !== 'password') {
      console.log('[Settings API] Switching away from password mode, invalidating sessions');
      invalidateAllPasswordSessions();
    }

    // Log audit event with changes (don't log actual password hash for security)
    const auditChanges = key === 'site_lock_password_hash'
      ? { key, message: 'Password updated (hash not logged for security)' }
      : {
          key,
          old_value: oldSetting?.value,
          new_value: value,
        };

    await logAuditEvent({
      user_id: auth.user!.id,
      action: "UPDATE",
      resource_type: "cms_setting",
      resource_id: updatedSetting.id,
      changes: auditChanges,
      ip_address: getIPAddress(request.headers),
      user_agent: getUserAgent(request.headers),
    });

    // CRITICAL: Invalidate settings cache so middleware picks up changes immediately
    settingsCache.invalidate();
    console.log('[Settings API] Cache invalidated after updating:', key);

    return NextResponse.json({ 
      success: true,
      data: updatedSetting 
    });
  } catch (error) {
    console.error("Error updating setting:", error);
    return NextResponse.json(
      { error: "Failed to update setting" },
      { status: 500 }
    );
  }
}
