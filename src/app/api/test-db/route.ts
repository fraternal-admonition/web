import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const adminClient = await createAdminClient();

    // Test 1: Check if we can connect
    const { data: testData, error: testError } = await adminClient
      .from("users")
      .select("count")
      .limit(1);

    if (testError) {
      return NextResponse.json({
        success: false,
        error: "Failed to query users table",
        details: testError,
        envCheck: {
          hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        },
      });
    }

    // Test 2: Create a test auth user first, then try to insert profile
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = "test-password-123";
    
    // Create test auth user
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
    });

    let insertError = null;
    let canInsert = false;

    if (!authError && authData.user) {
      // Now try to insert the profile
      const { data: insertData, error: profileInsertError } = await adminClient
        .from("users")
        .insert({
          id: authData.user.id,
          role: "USER",
          is_banned: false,
        })
        .select()
        .single();

      insertError = profileInsertError;
      canInsert = !profileInsertError;

      // Clean up: delete both profile and auth user
      if (!profileInsertError) {
        await adminClient.from("users").delete().eq("id", authData.user.id);
      }
      await adminClient.auth.admin.deleteUser(authData.user.id);
    } else {
      insertError = authError;
    }

    return NextResponse.json({
      success: true,
      message: canInsert ? "Database connection working! Service role can insert profiles." : "Service role configured but insert failed",
      tests: {
        canQuery: !testError,
        canCreateAuthUser: !authError,
        canInsert: canInsert,
        insertError: insertError?.message || null,
      },
      envCheck: {
        hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        serviceRoleKeyPrefix:
          process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + "...",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: "Unexpected error",
        message: error.message,
        envCheck: {
          hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        },
      },
      { status: 500 }
    );
  }
}
