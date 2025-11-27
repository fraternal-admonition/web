import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!userData || userData.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const alt = formData.get("alt") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 400 }
      );
    }

    // Create unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const extension = file.name.split(".").pop();
    const filename = `${timestamp}-${randomStr}.${extension}`;
    const filePath = `cms-images/${filename}`;

    // Upload to Supabase Storage
    const adminSupabase = await createAdminClient();
    
    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const { data: uploadData, error: uploadError } = await adminSupabase.storage
      .from("cms-assets")
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload image" },
        { status: 500 }
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = adminSupabase.storage.from("cms-assets").getPublicUrl(filePath);

    // Save to cms_assets table
    const { data: asset, error: assetError } = await adminSupabase
      .from("cms_assets")
      .insert({
        kind: "image",
        path: filePath,
        alt: alt || file.name,
        meta: {
          originalName: file.name,
          size: file.size,
          mimeType: file.type,
        },
      })
      .select()
      .single();

    if (assetError) {
      console.error("Asset DB error:", assetError);
      // Clean up uploaded file
      await adminSupabase.storage.from("cms-assets").remove([filePath]);
      return NextResponse.json(
        { error: "Failed to save asset metadata" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: publicUrl,
      assetId: asset.id,
      path: filePath,
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}
