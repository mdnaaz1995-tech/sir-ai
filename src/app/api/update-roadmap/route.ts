export const maxDuration = 30;

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function PATCH(request: NextRequest) {
  try {
    const { id, content } = await request.json();

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Roadmap ID is required" },
        { status: 400 }
      );
    }

    if (typeof content !== "string") {
      return NextResponse.json(
        { error: "roadmap_content must be a string" },
        { status: 400 }
      );
    }

    // --- Authenticate user via cookies ---
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {
          // read-only in route handler
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Verify the roadmap belongs to this user
    const { data: existing, error: fetchError } = await supabase
      .from("roadmaps")
      .select("user_id")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: "Roadmap not found" },
        { status: 404 }
      );
    }

    if (existing.user_id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Update the roadmap_content
    const { error: updateError } = await supabase
      .from("roadmaps")
      .update({ roadmap_content: content })
      .eq("id", id);

    if (updateError) {
      console.error("Failed to update roadmap:", updateError.message);
      return NextResponse.json(
        { error: "Failed to save progress" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Update roadmap error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}