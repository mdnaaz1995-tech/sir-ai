import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://axbgdvictqcumlhlypie.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_F2G3t3Y5OgcFsEoV8wH";

const SYSTEM_PROMPT = `You are SIR AI, a world-class learning architect. Generate a structured, phase-by-phase mastery roadmap for the given skill.

Format your response in Markdown with these exact sections:

## 🎯 Vision Phase
*Define what mastery looks like and set clear milestones.*

## 📚 Fundamentals Phase  
*Core concepts, theories, and foundational knowledge.*

## 🔧 Core Skills Phase
*Hands-on tools, frameworks, and practical abilities.*

## 🏗️ Build Phase
*Real-world projects to apply and solidify learning.*

## 🚀 Mastery Phase
*Advanced topics, specialization, and portfolio-worthy work.*

For each phase include 3-5 actionable items with clear descriptions. Add a "🏆 PROOF OF WORK:" section at the end with concrete project ideas.

Keep the tone motivational and precise. Use emoji bullets for scannability.`;

export async function POST(request: NextRequest) {
  try {
    const { skill } = await request.json();

    if (!skill || typeof skill !== "string" || !skill.trim()) {
      return NextResponse.json(
        { error: "Skill is required" },
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
          // read-only in route handler — no need to set cookies
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

    // --- Call Groq API ---
    if (!GROQ_API_KEY) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama3-70b-8192",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: `Generate a detailed mastery roadmap for: ${skill.trim()}`,
            },
          ],
          temperature: 0.7,
          max_tokens: 4096,
        }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Groq API error:", response.status, errorBody);
      return NextResponse.json(
        { error: `Groq API returned ${response.status}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    const roadmap = data.choices?.[0]?.message?.content;

    if (!roadmap) {
      return NextResponse.json(
        { error: "Groq returned an empty response" },
        { status: 502 }
      );
    }

    // --- Persist to Supabase roadmaps table ---
    const { error: insertError } = await supabase.from("roadmaps").insert({
      user_id: user.id,
      topic: skill.trim(),
      content: roadmap,
    });

    if (insertError) {
      console.error("Failed to save roadmap:", insertError.message);
      // Don't fail the request — the user still gets their roadmap
    }

    return NextResponse.json({ roadmap, skill: skill.trim() });
  } catch (error) {
    console.error("Generate roadmap error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}