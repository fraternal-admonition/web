import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!userData || userData.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const adminSupabase = await createAdminClient();

    const { data: settings, error } = await adminSupabase
      .from("cms_settings")
      .select("*")
      .order("key", { ascending: true });

    if (error) {
      throw error;
    }

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
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!userData || userData.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { key, value_json } = body;

    if (!key) {
      return NextResponse.json({ error: "Key is required" }, { status: 400 });
    }

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

    return NextResponse.json({ data: newSetting }, { status: 201 });
  } catch (error) {
    console.error("Error creating setting:", error);
    return NextResponse.json(
      { error: "Failed to create setting" },
      { status: 500 }
    );
  }
}
