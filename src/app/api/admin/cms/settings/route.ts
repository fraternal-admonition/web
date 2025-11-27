import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { checkAdminAuth } from "@/lib/admin-auth";
import { CMSSettingSchema } from "@/lib/security/validators";
import { logAuditEvent, getIPAddress, getUserAgent } from "@/lib/security/audit-log";
import { getAllSettings } from "@/lib/cms/settings-service";
import { settingsCache } from "@/lib/cms/settings-cache";

export async function GET(request: NextRequest) {
  try {
    const auth = await checkAdminAuth();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Return settings merged with schema
    const settings = await getAllSettings();

    return NextResponse.json({ data: settings });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await checkAdminAuth();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();

    // Validate input
    const validation = CMSSettingSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { key, value_json } = validation.data;

    const adminSupabase = await createAdminClient();

    // Check if key already exists
    const { data: existingSetting } = await adminSupabase
      .from("cms_settings")
      .select("id")
      .eq("key", key)
      .single();

    if (existingSetting) {
      return NextResponse.json(
        { error: "A setting with this key already exists" },
        { status: 400 }
      );
    }

    const { data: newSetting, error } = await adminSupabase
      .from("cms_settings")
      .insert({
        key,
        value_json: value_json || {},
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log audit event
    await logAuditEvent({
      user_id: auth.user!.id,
      action: "CREATE",
      resource_type: "cms_setting",
      resource_id: newSetting.id,
      changes: { key, value_json },
      ip_address: getIPAddress(request.headers),
      user_agent: getUserAgent(request.headers),
    });

    // Invalidate settings cache so new setting is immediately available
    settingsCache.invalidate();
    console.log('[Settings API] Cache invalidated after creating:', key);

    return NextResponse.json({ data: newSetting }, { status: 201 });
  } catch (error) {
    console.error("Error creating setting:", error);
    return NextResponse.json(
      { error: "Failed to create setting" },
      { status: 500 }
    );
  }
}
