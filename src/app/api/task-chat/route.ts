export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";

const GROQ_API_KEY = process.env.GROQ_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { topic, currentTask, userMessage } = await request.json();
    console.log("[task-chat] Received:", { topic, currentTask, userMessage });

    if (!topic || !currentTask || !userMessage) {
      console.error("[task-chat] Missing fields");
      return NextResponse.json(
        { error: "topic, currentTask, and userMessage are required" },
        { status: 400 }
      );
    }

    if (!GROQ_API_KEY) {
      console.error("[task-chat] GROQ_API_KEY is not set");
      return NextResponse.json(
        { error: "GROQ_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const systemPrompt = `You are SIR AI, a world-class tech mentor. The user is currently learning "${topic}". Right now, they are working on this exact task: "${currentTask}". Answer their question directly related to this task. Speak in the exact language/dialect the user uses. Keep it highly actionable, concise, and encouraging. Talk like a senior developer guiding a junior. Do not output markdown code blocks unless giving an actual code snippet. Always use short paragraphs, bullet points, and line breaks to make your response easy to read.`;

    console.log("[task-chat] Calling Groq with model: llama-3.3-70b-versatile");

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
        }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("[task-chat] Groq API error:", response.status, errorBody);
      return NextResponse.json(
        { error: `Groq API returned ${response.status}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    const aiMessage = data.choices?.[0]?.message?.content;
    console.log("[task-chat] Groq response received, length:", aiMessage?.length || 0);

    if (!aiMessage) {
      return NextResponse.json(
        { error: "Groq returned an empty response" },
        { status: 502 }
      );
    }

    return NextResponse.json({ reply: aiMessage });
  } catch (error: any) {
    console.error("[task-chat] Unhandled exception:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
