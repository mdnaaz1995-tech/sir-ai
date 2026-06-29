export const maxDuration = 60;

import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase-server";

const GROQ_API_KEY = process.env.GROQ_API_KEY;

// ── Frustration/stuck keywords for SOS Protocol ──
const FRUSTRATION_KEYWORDS = [
  "samajh nahi", "samajh nhi", "nahi samajh", "nhi samajh",
  "fail", "failed", "failing",
  "stuck", "getting stuck", "im stuck", "i'm stuck", "m stuck",
  "nahi pata", "nhi pata", "pata nahi", "pata nhi",
  "madad", "help me", "help karo", "guide karo",
  "confuse", "confused", "confusing",
  "doubt", "doubt hai", "problem hai", "issue hai",
  "error aa", "error aaraha", "error mil", "error aa raha",
  "nahi ho", "nhi ho", "nahi hoga", "nhi hoga",
  "kuch samajh", "kuch nhi", "kuch nahi",
];

function containsFrustrationKeyword(message: string): boolean {
  const lower = message.toLowerCase();
  return FRUSTRATION_KEYWORDS.some((keyword) => lower.includes(keyword));
}

export async function POST(request: NextRequest) {
  try {
    const { topic, currentTask, userMessage, roadmapId, taskIndex } = await request.json();
    console.log("[task-chat] Received:", { topic, currentTask, userMessage, roadmapId, taskIndex });

    if (!topic || !currentTask || !userMessage) {
      return new Response(
        JSON.stringify({ error: "topic, currentTask, and userMessage are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!GROQ_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GROQ_API_KEY is not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // ── Fetch AI context from database (retry tracking for SOS Protocol) ──
    let retryCount = 0;
    let lastError: string | null = null;
    let isStuck = false;

    if (roadmapId && taskIndex !== undefined && taskIndex !== null) {
      try {
        const supabase = await createClient();
        const { data, error } = await supabase
          .from("task_chats")
          .select("retry_count, last_error, is_stuck")
          .eq("roadmap_id", roadmapId)
          .eq("task_index", taskIndex)
          .single();

        if (!error && data) {
          retryCount = data.retry_count ?? 0;
          lastError = data.last_error;
          isStuck = data.is_stuck ?? false;
          console.log("[task-chat] AI context loaded:", { retryCount, lastError, isStuck });
        } else {
          console.log("[task-chat] No existing task_chats row — using defaults (0, null, false)");
        }
      } catch (dbErr) {
        console.error("[task-chat] Failed to fetch AI context:", dbErr);
        // Non-fatal — proceed with defaults
      }
    }

    // ── SOS Protocol: Detect frustration/stuck keywords and increment retry_count ──
    const userIsFrustrated = containsFrustrationKeyword(userMessage);
    if (userIsFrustrated && roadmapId && taskIndex !== undefined && taskIndex !== null) {
      const newRetryCount = retryCount + 1;
      const newIsStuck = newRetryCount >= 3;
      console.log("[task-chat] 🚨 Frustration detected! Incrementing retry_count:", {
        from: retryCount,
        to: newRetryCount,
        keywordMatch: FRUSTRATION_KEYWORDS.find((k) =>
          userMessage.toLowerCase().includes(k)
        ),
      });

      // Persist the incremented retry tracking to the database immediately
      try {
        const supabase = await createClient();
        await supabase.from("task_chats").upsert(
          {
            roadmap_id: roadmapId,
            task_index: taskIndex,
            retry_count: newRetryCount,
            last_error: userMessage,
            is_stuck: newIsStuck,
          },
          { onConflict: "roadmap_id, task_index" }
        );
      } catch (dbErr) {
        console.error("[task-chat] Failed to persist frustration increment:", dbErr);
      }

      // Update local variables so the system prompt reflects the new count
      retryCount = newRetryCount;
      lastError = userMessage;
      isStuck = newIsStuck;
    }

    // ── Build the SOS context injection string ──
    const sosContextBlock = isStuck
      ? `CURRENT STATUS: The user IS STUCK (retry_count = ${retryCount}). The last error was: "${lastError}". SOS PROTOCOL IS NOW ACTIVE — you MUST skip all Socratic questions and provide the exact, step-by-step solution immediately.`
      : retryCount > 0
      ? `CURRENT STATUS: The user has retried this ${retryCount} time(s). Last error: "${lastError}". Be aware of their struggle. If they seem frustrated, consider activating SOS mode.`
      : "CURRENT STATUS: This is a fresh attempt. No prior errors.";

    const systemPrompt = `You are Ustad — a 24/7 personalized, action-oriented upskilling mentor for SIR AI. You teach any skill from zero to mastery using Hinglish. You are strict but supportive. The user is currently learning "${topic}" and working on this task: "${currentTask}".

${sosContextBlock}

CORE RULES (You must follow ALL of them):

1. THE M-PoW RULE (Proof of Work — Mandatory)
   - Always end a learning module by assigning a practical micro-mission.
   - You must explicitly tell the user what type of Proof of Work (PoW) to submit in the UI:
     * "URL" — for coding tasks (deployed link, GitHub repo, or live demo)
     * "Image" — for design/screenshots (UI mockup, error screenshot, or visual output)
     * "Audio" — for communication/sales (recorded pitch, presentation, or verbal explanation)
   - Example: "Ab tumhara PoW yeh hai: ek simple landing page banao aur GitHub link submit karo (type: URL)."

2. SOCRATIC METHODOLOGY (Strict — No Spoon-Feeding)
   - NEVER give the complete copy-paste code or final answer immediately.
   - Always respond with guiding questions, hints, and thought-provoking prompts first.
   - Make the user think and arrive at the solution themselves.
   - Examples: "Mera code likhne ka kaam nahi hai, main guide karunga. Tumhe kya lagta hai error kahan hai?", "Pehle khud socho — iss problem ka root cause kya ho sakta hai?"
   - Only reveal code after the user has made a genuine attempt AND shared their attempt with you.

3. THE SOS PROTOCOL (Anti-Stuck Logic — Overrides Socratic Method)
   - If retry_count >= 3 OR is_stuck = true → ABANDON the Socratic method immediately.
   - Also activate SOS if the user expresses frustration, gets an error, or clearly states they are completely lost.
   - When SOS is active: Provide a direct, step-by-step exact solution to unblock them right away.
   - No questions. No hints. Just the fix. The goal is to unblock, not to frustrate further.
   - Example: "Theek hai, tension mat lo. Yeh raha exact solution step-by-step: ..."

4. LANGUAGE MIRRORING (Crucial)
   - Mirror the user's language EXACTLY.
   - If they write in Hinglish (Hindi in English script) → reply in natural, conversational Hinglish.
   - If they write in English → reply in English.
   - If they write in Hindi script → reply in Hindi script.
   - Consistency is key — do NOT switch languages mid-way unless the user does.

5. ACTION & DEBUGGING FOCUS
   - Treat every query as either a debugging session or a project-building step.
   - Before giving advice, ask the user to: share their current code, paste the exact error message, or describe what they've tried so far.
   - If they haven't shared context, say something like: "Mujhe error ya code dikhao, tabhi main guide kar sakta hoon."
   - Keep responses concise, actionable, and structured (short paragraphs, bullet points).

6. RELATABLE DESI ANALOGIES
   - Use real-world, desi analogies to explain complex tech concepts.
   - Examples:
     * API → "Dukaan ke counter pe baitha hua shopkeeper — tum order dete ho, woh samaan laake deta hai."
     * Database → "Almirah jisme saara data file ke hisaab se rakha hai."
     * Function → "Chai banane ka recipe — inputs hain (paani, patti, doodh), process hai, output hai chai."
     * Error/Exception → "Ghar mein wiring mein short circuit — isko dhundo aur theek karo tabhi light aayegi."
   - Be creative but keep analogies simple and relatable.

PERSONA TONE:
- FIRM but ENCOURAGING (like a strict but loving older brother / bade bhai).
- Never rude. Never dismissive. Always push the user to grow.
- If the user is stuck and frustrated, first acknowledge their effort, then guide them step-by-step.
- Celebrate their small wins: "Shaabash! Ab agla step karte hain."

FORMATTING:
- Use rich markdown, bullet points, and bold text for readability.
- Keep paragraphs extremely short for mobile users.
- Do NOT output markdown code blocks unless giving an actual code snippet.`;

    console.log("[task-chat] Calling Groq with streaming model: llama-3.3-70b-versatile");
    console.log("[task-chat] Final context injected into system prompt:", {
      retryCount,
      isStuck,
      sosContextBlock: sosContextBlock.slice(0, 120) + "...",
    });

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
          temperature: 0.7,
          max_tokens: 1024,
          stream: true,
        }),
      }
    );

    if (!response.ok || !response.body) {
      const errorBody = await response.text().catch(() => "");
      console.error("[task-chat] Groq API error:", response.status, errorBody);
      return new Response(
        JSON.stringify({ error: `Groq API returned ${response.status}` }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    // Pipe the streaming response back to the client
    const stream = response.body;

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("[task-chat] Unhandled exception:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}