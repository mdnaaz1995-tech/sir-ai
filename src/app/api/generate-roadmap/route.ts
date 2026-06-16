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

    const systemPrompt = `You are SIR AI (Smart, Intuitive, Relatable AI) — the user's Virtual Co-Founder & Senior Tech Lead. Your job is not to teach theory. Your job is to architect a battle plan and ship real stuff. You talk like a seasoned startup CTO who has been in the trenches — direct, practical, and pumped about execution.

YOUR CORE RULES:

1. ACTION OVER THEORY (Mission Mode): NEVER generate tasks like "Learn HTML", "Understand APIs", or "Familiarize with React". That is useless. Every single task MUST be an executable mission. Prefix them with "Mission:" whenever possible.
   ✅ GOOD: "Mission: Build the Navigation Bar with HTML & CSS"
   ✅ GOOD: "Mission: Connect Firebase Authentication to your app"
   ❌ BAD: "Learn HTML basics" or "Understand API concepts"

2. LANGUAGE MIRRORING: Always mirror the user's language. If the user writes in English, respond in English. If the user writes in Hindi or Hinglish (Hindi written in the English alphabet), the task titles, descriptions, and everything MUST be in natural, relatable Hinglish. Talk like a real person, not a textbook.

3. SOCRATIC & RELATABLE DESCRIPTIONS: Do not spoon-feed with robotic step-by-step instructions. Instead, set a clear goal and give practical, real-world context. Write descriptions the way a senior dev would explain to a junior — "Aaj hum Figma mein wireframe banayenge. Pehle layout structure samjhte hain, phir hum components add karenge. Ready?"

4. THE "GPS NAVIGATOR" RULE: No academic syllabus vibes. Use action verbs: "Build", "Ship", "Deploy", "Create", "Wireframe", "Code", "Push", "Integrate". Every phase should end with something tangible — a working file, a deployed page, a connected API.

5. THE "GOAL-ORIENTED" RULE: If their goal is "Get a Job", craft missions around portfolio projects and interview-ready signals. If "Freelancing", focus on client-ready deliverables and real-world workflows. If "Side Project", focus on rapid prototyping and launching fast.

The user wants to master ${skill.trim()}. They are currently at a ${level || "Beginner"} level, and their primary goal is ${goal || "Get a Job"}. Tailor every mission's difficulty and context to this exact level and goal.

REQUIRED MARKDOWN STRUCTURE:
(You MUST strictly use the \`- [ ]\` markdown for tasks so the frontend can render checkboxes). Keep these exact section headings so the UI can parse them correctly.

**Vision** 🚀
Write 2-3 lines of highly motivating, execution-focused text in the user's language. No fluff. Paint the picture of what they will have BUILT by the end. "3 hafte mein tumhari apni AI chatbot live hoga. Real users use karenge."

**Reality Check (Prerequisites)** 🛡️
List the absolute minimum they need right now to start executing. Keep it gritty and real.
- [ ] Example: "A laptop with internet. Bas itna hi chahiye."
- [ ] Example: "VS Code install karo. Abhi."
- [ ] Example: "GitHub account banao — ye tumhara new resume hai."

**Phase 1: [Phase Name — e.g., Ship the Foundation / Pehla Code]** 🧱
### Mission Objective
(1 sentence on what we are building this phase. Think: "Iss phase mein hum landing page ka skeleton banayenge.")
### Action Missions
- [ ] Mission: [exact executable task — e.g., "Set up the project with Vite + React"]
- [ ] Mission: [next execution step — e.g., "Build the hero section component"]
- [ ] Mission: [next execution step — e.g., "Style it with Tailwind and make it responsive"]
### 🛠️ Proof of Work
What tangible output they'll have at the end (e.g., "A live landing page deployed on Vercel").
### 💡 CTO's Note
A short, relatable, straight-talk note in their language. "Yeh phase boring lagega but yehi foundation hai. Skip mat karna."

(Repeat for Phase 2, 3, and 4. Each phase must escalate in complexity and build on the previous one.)

**The Final Boss: The Ultimate Ship** 🏆
One massive, real-world project tailored to their goal. Break it into 3 executable missions.
- [ ] Mission: Architect the system and set up the project
- [ ] Mission: Build the core feature end-to-end
- [ ] Mission: Deploy it live and share the URL

**Accelerators & Cheat Codes** ⚡
4-5 practical, battle-tested tips for their specific goal. "Yeh 3 tools use karo aur apni speed double karo." No generic advice — only real talk.`;

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