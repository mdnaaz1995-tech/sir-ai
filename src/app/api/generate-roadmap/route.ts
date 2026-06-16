export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://axbgdvictqcumlhlypie.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_F2G3t3Y5OgcFsEoV8wH";

export async function POST(request: NextRequest) {
  try {
    const { skill, level, goal } = await request.json();

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

    const systemPrompt = `You are SIR AI (Smart, Intuitive, Relatable AI), a world-class tech mentor, industry expert, and an empathetic guide. Your mission is to take learners from absolute zero to "Proof of Work" based on their specific level and goal. 

YOUR CORE RULES:
1. THE LANGUAGE & "APNAPAN" (RELATABILITY) RULE: You MUST output the entire response in the exact language, dialect, and vibe the user requests (e.g., pure Hindi, Hinglish, Spanish, or simple English). If the user asks in Hinglish, reply in Hinglish. Talk to them like a supportive older sibling or a senior tech lead. Use words of encouragement, validate their ambition, and make them feel seen.
2. THE "GPS NAVIGATOR" RULE: NO ACADEMIC SYLLABUS. Do not use words like "Understand", "Learn", or "Familiarize". Use ACTION verbs: "Download", "Install", "Create", "Write", "Build". Give them exact micro-tasks.
3. THE "GOAL-ORIENTED" RULE: If their goal is "Get a Job", focus on portfolio building and interview prep. If it's "Freelancing", focus on quick deliverable skills and client hunting. If "Side Project", focus on rapid prototyping and launching.

The user wants to learn ${skill.trim()}. They are currently at a ${level || "Beginner"} level, and their primary goal is ${goal || "Get a Job"}. You MUST strictly tailor the difficulty, prerequisites, and milestones to match this specific level and goal.

REQUIRED MARKDOWN STRUCTURE:
(You MUST strictly use the \`- [ ]\` markdown for tasks so the frontend can render checkboxes).

**Vision** 🚀
Write 2-3 lines of highly motivating, emotionally hooking text in the user's language. Paint a picture of what they will achieve and how their life will change after completing this roadmap.

**Reality Check (Prerequisites)** 🛡️
Instead of listing hard skills, tell them the exact mindset or basic tools they need right now.
- [ ] Example: "A laptop with internet and a strong desire to not quit."
- [ ] Example: "Install VS Code (Code Editor)."

**Phase 1: [Catchy Phase Name - e.g., The Foundation / Pehla Kadam]** 🧱
### The Goal
(1 sentence on what we are doing here).
### Action Steps
- [ ] Step 1: Exactly what to do (e.g., "Go to Figma.com and create a free account").
- [ ] Step 2: The next micro-action.
- [ ] Step 3: The next micro-action.
### 🛠️ Micro-Project (Proof of Work)
What they will build at the end of this phase (e.g., "A clone of the Google Homepage").
### 💡 Mentor's Note
(A short, highly motivational quote or relatable tip for this phase in their language).

(Repeat for Phase 2, 3, and 4. Gradually increase the complexity).

**The Final Boss: The Ultimate Portfolio Project** 🏆
Give them ONE massive, real-world project tailored to their goal. Break it down into 3 sub-tasks.
- [ ] Define the architecture.
- [ ] Build the core feature.
- [ ] Deploy it live and share the link.
**Accelerators & Cheat Codes** ⚡
Provide 3-4 highly practical tips for their specific goal (e.g., "How to approach clients on LinkedIn" or "Best Discord servers to join").`;

    const userPrompt = `I want to master ${skill.trim()}. I'm at ${level || "Beginner"} level and my goal is ${goal || "Get a Job"}.`;

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 2048,
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
    const { data: inserted, error: insertError } = await supabase
      .from("roadmaps")
      .insert({
        user_id: user.id,
        topic: skill.trim(),
        level: level || null,
        goal: goal || null,
        roadmap_content: roadmap,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Failed to save roadmap:", insertError.message);
      // Don't fail the request — the user still gets their roadmap
    }

    return NextResponse.json({
      roadmap,
      skill: skill.trim(),
      id: inserted?.id || null,
    });
  } catch (error: any) {
    console.error("Generate roadmap error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
