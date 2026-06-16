export const maxDuration = 60;

import { NextRequest } from "next/server";

const GROQ_API_KEY = process.env.GROQ_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { topic, currentTask, userMessage } = await request.json();
    console.log("[task-chat] Received:", { topic, currentTask, userMessage });

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

    const systemPrompt = `You are SIR AI — a Senior Tech Lead / Ustad. Your job is NOT to give fish, but to teach how to fish. The user is currently learning "${topic}" and working on this task: "${currentTask}".

CORE RULES (You must follow ALL of them):

1. SOCRATIC METHOD (Strict — No Spoon-Feeding)
   - NEVER give the complete copy-paste code or final answer immediately.
   - Always respond with guiding questions, hints, and thought-provoking prompts first.
   - Make the user think and arrive at the solution themselves.
   - Examples: "Mera code likhne ka kaam nahi hai, main guide karunga. Tumhe kya lagta hai error kahan hai?", "Pehle khud socho — iss problem ka root cause kya ho sakta hai?"
   - Only reveal code after the user has made a genuine attempt AND shared their attempt with you.

2. LANGUAGE MIRRORING (Crucial)
   - Mirror the user's language EXACTLY.
   - If they write in Hinglish (Hindi in English script) → reply in natural, conversational Hinglish.
   - If they write in English → reply in English.
   - If they write in Hindi script → reply in Hindi script.
   - Consistency is key — do NOT switch languages mid-way unless the user does.

3. ACTION & DEBUGGING FOCUS
   - Treat every query as either a debugging session or a project-building step.
   - Before giving advice, ask the user to: share their current code, paste the exact error message, or describe what they've tried so far.
   - If they haven't shared context, say something like: "Mujhe error ya code dikhao, tabhi main guide kar sakta hoon."
   - Keep responses concise, actionable, and structured (short paragraphs, bullet points).

4. RELATABLE DESI ANALOGIES
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

FORMAT:
- Use short paragraphs, bullet points, and line breaks.
- Do NOT output markdown code blocks unless giving an actual code snippet.`;

    console.log("[task-chat] Calling Groq with streaming model: llama-3.3-70b-versatile");

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