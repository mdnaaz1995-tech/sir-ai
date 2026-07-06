export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

const GROQ_API_KEY = process.env.GROQ_API_KEY;

// ── Supported Groq vision models (no additional API key needed) ──
const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

// ── Helper: update project_progress with verification results ──
async function updateVerificationResult(
  submissionId: string,
  verifiedStatus: boolean,
  feedback: string,
  roadmapId: string,
  taskIndex: number
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("project_progress")
    .update({
      verified_status: verifiedStatus,
      verified_feedback: feedback,
      verified_timestamp: new Date().toISOString(),
    })
    .eq("id", submissionId)
    .eq("roadmap_id", roadmapId)
    .eq("task_index", taskIndex);

  if (error) {
    console.error("[verify-pow] Failed to update verification results:", error.message);
    throw error;
  }
  console.log("[verify-pow] Verification results saved to project_progress:", {
    submissionId,
    verifiedStatus,
  });
}

export async function POST(request: NextRequest) {
  try {
    const { submission_id, image_url: requestImageUrl } = await request.json();
    console.log("[verify-pow] Received verification request for submission_id:", submission_id);

    if (!submission_id) {
      return NextResponse.json(
        { error: "submission_id is required" },
        { status: 400 }
      );
    }

    if (!GROQ_API_KEY) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is not configured" },
        { status: 500 }
      );
    }

    // ── 1. Verify the user is authenticated ──
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("[verify-pow] Auth error:", authError?.message);
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // ── 2. Fetch the submission and verify ownership ──
    const { data: submission, error: subError } = await supabase
      .from("project_progress")
      .select("id, user_id, roadmap_id, task_index, task_text, submission_type, submission_data, proof_url")
      .eq("id", submission_id)
      .single();

    if (subError || !submission) {
      console.error("[verify-pow] Submission not found:", subError?.message);
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // Ownership check: only the submission owner can trigger verification
    if (submission.user_id !== user.id) {
      console.error("[verify-pow] Unauthorized: user", user.id, "does not own submission", submission_id);
      return NextResponse.json(
        { error: "You can only verify your own submissions" },
        { status: 403 }
      );
    }

    // ── 3. Determine what to verify (image or URL) ──
    const taskObjective = submission.task_text || "Unknown task";
    let imageUrl: string | null = null;
    let verificationPrompt = "";

    if (submission.submission_type === "image") {
      // Extract image URL from submission_data JSON
      const subData = submission.submission_data as Record<string, unknown> | null;
      // Priority: 1) image_url passed directly from client, 2) file_url in submission_data, 3) proof_url column
      imageUrl = requestImageUrl || (subData?.file_url as string) || null;

      // Fallback: use proof_url if file_url is not available in submission_data
      if (!imageUrl) {
        imageUrl = (submission as any).proof_url || null;
      }

      if (!imageUrl) {
        return NextResponse.json(
          { error: "No image URL found in submission data" },
          { status: 400 }
        );
      }

      verificationPrompt = `You are an AI mentor evaluating a student's Proof of Work submission.

Task Objective: "${taskObjective}"

The student submitted the above image as proof of completing this task.

Evaluate the image carefully:
1. Does the image show relevant work related to the task objective?
2. Is there evidence of genuine effort and learning?
3. Does it demonstrate the expected skill or output?

Respond in JSON format with:
- "verified": boolean (true if the submission demonstrates reasonable effort toward the task)
- "feedback": string (2-3 sentences of constructive feedback in Hinglish, encouraging but honest)
- "confidence_score": number between 0 and 1

Be generous but honest — if the image is clearly unrelated or low-effort, mark as not verified.`;
    } else {
      return NextResponse.json({
        verified: null,
        feedback: "Vision-based verification is only available for image submissions. URL submissions are accepted as-is.",
        confidence_score: 0,
      });
    }

    // ── 4. Call Groq Vision model ──
    console.log("[verify-pow] Calling Groq Vision model with:", {
      model: VISION_MODEL,
      imageUrl: imageUrl.slice(0, 80) + "...",
      taskObjective: taskObjective.slice(0, 80) + "...",
    });

    const visionResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: VISION_MODEL,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: verificationPrompt },
                {
                  type: "image_url",
                  image_url: { url: imageUrl },
                },
              ],
            },
          ],
          temperature: 0.3,
          max_tokens: 1024,
          response_format: { type: "json_object" },
        }),
      }
    );

    if (!visionResponse.ok) {
      const errorBody = await visionResponse.text().catch(() => "");
      console.error("[verify-pow] Groq Vision API error:", visionResponse.status, errorBody);
      return NextResponse.json(
        { error: `Vision model returned ${visionResponse.status}: ${errorBody}` },
        { status: 502 }
      );
    }

    const visionData = await visionResponse.json();
    const aiContent = visionData.choices?.[0]?.message?.content || "{}";
    console.log("[verify-pow] Vision model raw response:", aiContent.slice(0, 300));

    // ── 5. Parse the JSON response ──
    let verified = false;
    let feedback = "Verification could not be completed.";
    let confidenceScore = 0;

    try {
      const parsed = JSON.parse(aiContent);
      verified = parsed.verified === true;
      feedback = parsed.feedback || feedback;
      confidenceScore = typeof parsed.confidence_score === "number" ? parsed.confidence_score : 0;
    } catch (parseErr) {
      console.error("[verify-pow] Failed to parse vision response as JSON:", parseErr);
      verified = aiContent.toLowerCase().includes('"verified": true');
      feedback = aiContent;
    }

    // ── 6. Update the database with verification results ──
    await updateVerificationResult(
      submission_id,
      verified,
      feedback,
      submission.roadmap_id,
      submission.task_index
    );

    // ── 7. Return the result ──
    const result = {
      verified,
      feedback,
      confidence_score: confidenceScore,
    };
    console.log("[verify-pow] Verification complete:", result);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[verify-pow] Unhandled exception:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}