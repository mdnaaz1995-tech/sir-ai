"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import confetti from "canvas-confetti";

// ── Types ──
interface TaskItem {
  lineIndex: number;
  text: string;
  checked: boolean;
}

interface PhaseGroup {
  title: string;
  tasks: TaskItem[];
}

export default function RoadmapDetailPage() {
  const params = useParams();
  const router = useRouter();
  const roadmapId = params.id as string | undefined;

  const [roadmap, setRoadmap] = useState<{
    topic: string;
    roadmap_content: string;
    created_at: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [activeTaskIndex, setActiveTaskIndex] = useState(0);
  const [isInitialIndexLoaded, setIsInitialIndexLoaded] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const contentRef = useRef("");

  // ── Proof of Work state ──
  const [powUrl, setPowUrl] = useState("");
  const [powSaving, setPowSaving] = useState(false);
  const [powError, setPowError] = useState<string | null>(null);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const powInputRef = useRef<HTMLInputElement>(null);
  // ── New multimodal submission state ──
  const [submissionType, setSubmissionType] = useState<'url' | 'image' | 'audio'>('url');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);

  // ── Verification state ──
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{
    verified: boolean | null;
    feedback: string;
    confidence_score: number;
  } | null>(null);
  const [isMilestoneCompleted, setIsMilestoneCompleted] = useState(false);
  const [lastSubmittedImageId, setLastSubmittedImageId] = useState<string | null>(null);
  const lastSubmittedImageUrlRef = useRef<string | null>(null);

  // ── Chat state ──
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "ai"; content: string }[]>([
    { role: "ai", content: "Need help with this step? Ask me here!" },
  ]);
  const [chatHistoryLoaded, setChatHistoryLoaded] = useState(false);

  // ── AI context state (retry tracking for SOS Protocol) ──
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);
  const [isStuck, setIsStuck] = useState(false);
  const retryThreshold = 3;

  // ── Celebration state ──
  const confettiFiredRef = useRef(false);
  const prevDoneCountRef = useRef(0);

  // ── Confetti trigger on task completion ──
  useEffect(() => {
    if (!roadmap) return;
    const tasks = roadmap.roadmap_content.match(/^\s*- \[([ x])]/gm) || [];
    const doneCount = tasks.filter((t) => t.includes("x")).length;

    if (doneCount > prevDoneCountRef.current && doneCount > 0 && !confettiFiredRef.current) {
      confettiFiredRef.current = true;
      const duration = 800;
      const end = Date.now() + duration;
      const frame = () => {
        confetti({
          particleCount: 4,
          angle: 90,
          spread: 120,
          origin: { x: 0.5, y: 0.85 },
          colors: ["#a78bfa", "#818cf8", "#f472b6", "#34d399", "#fbbf24"],
          ticks: 40,
          gravity: 0.6,
          scalar: 0.8,
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    }
    prevDoneCountRef.current = doneCount;
  }, [roadmap?.roadmap_content]);

  // ── Streaming state ──
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [chatInput, setChatInput] = useState("");
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  // ── Fetch / clear chat history when task changes ──
  useEffect(() => {
    if (!roadmapId || !isInitialIndexLoaded) return;

    const fetchChatHistory = async () => {
      setChatMessages([{ role: "ai", content: "Need help with this step? Ask me here!" }]);
      setChatHistoryLoaded(false);
      setStreamingContent("");

      const { data, error } = await supabase
        .from("task_chats")
        .select("messages, retry_count, last_error, is_stuck")
        .eq("roadmap_id", roadmapId)
        .eq("task_index", activeTaskIndex)
        .single();

      if (!error && data?.messages && Array.isArray(data.messages) && data.messages.length > 0) {
        setChatMessages(data.messages);
      }
      if (!error && data) {
        setRetryCount((data as any).retry_count ?? 0);
        setLastError((data as any).last_error ?? null);
        setIsStuck((data as any).is_stuck ?? false);
      }
      setChatHistoryLoaded(true);
    };

    fetchChatHistory();
  }, [roadmapId, activeTaskIndex, isInitialIndexLoaded]);

  // ── Auto-scroll to bottom on new messages or streaming content ──
  useEffect(() => {
    if (shouldAutoScroll) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, streamingContent, shouldAutoScroll]);

  // Detect if user has scrolled up — pause auto-scroll
  const handleChatScroll = useCallback(() => {
    const el = chatContainerRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    setShouldAutoScroll(isAtBottom);
  }, []);

  // ── Parse roadmap into phases with tasks ──
  const parsePhases = useCallback((markdown: string): PhaseGroup[] => {
    const lines = markdown.split("\n");
    const groups: PhaseGroup[] = [];
    let currentPhaseTitle = "Overview";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      const phaseMatch = trimmed.match(
        /^#{2,4}\s+(Phase\s+\d+[:\s\-\–—]*(.*))/i
      );
      if (phaseMatch) {
        currentPhaseTitle = phaseMatch[1].replace(/[*#]/g, "").trim();
        groups.push({ title: currentPhaseTitle, tasks: [] });
        continue;
      }

      const boldMatch = trimmed.match(
        /^\*\*Phase\s+\d+[:\s\-\–—]*(.*?)\*\*/i
      );
      if (boldMatch) {
        currentPhaseTitle = trimmed.replace(/^\*\*|\*\*$/g, "").trim();
        groups.push({ title: currentPhaseTitle, tasks: [] });
        continue;
      }

      const checkboxMatch = trimmed.match(/^[-*+]\s+\[([ xX])\]\s+(.*)/);
      if (checkboxMatch) {
        const checked = checkboxMatch[1].toLowerCase() === "x";
        const taskText = checkboxMatch[2];
        if (groups.length === 0) {
          groups.push({ title: "Overview", tasks: [] });
        }
        groups[groups.length - 1].tasks.push({
          lineIndex: i,
          text: taskText,
          checked,
        });
      }
    }

    if (groups.length === 0) {
      const allTasks: TaskItem[] = [];
      for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        const checkboxMatch = trimmed.match(/^[-*+]\s+\[([ xX])\]\s+(.*)/);
        if (checkboxMatch) {
          allTasks.push({
            lineIndex: i,
            text: checkboxMatch[2],
            checked: checkboxMatch[1].toLowerCase() === "x",
          });
        }
      }
      if (allTasks.length > 0) {
        groups.push({ title: "Tasks", tasks: allTasks });
      }
    }

    return groups;
  }, []);

  const flatTasks = useCallback(
    (phases: PhaseGroup[]): TaskItem[] =>
      phases.flatMap((p) => p.tasks),
    []
  );

  // ── Stats ──
  const calcStats = useCallback((text: string) => {
    const tasks = text.match(/^\s*- \[([ x])]/gm) || [];
    const total = tasks.length;
    const done = tasks.filter((t) => t.includes("x")).length;
    return {
      total,
      done,
      pct: total > 0 ? Math.round((done / total) * 100) : 0,
    };
  }, []);

  // ── Toast ──
  const showToast = useCallback(
    (msg: string, type: "success" | "error") => {
      setToast({ message: msg, type });
      setTimeout(() => setToast(null), 2500);
    },
    []
  );

  // ── Fetch roadmap ──
  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/");
        return;
      }
      if (!roadmapId) {
        setError("Invalid roadmap ID");
        setLoading(false);
        return;
      }
      let data: any;
      let fe: any;

      const result = await supabase
        .from("roadmaps")
        .select("topic, roadmap_content, created_at, current_task_index")
        .eq("id", roadmapId)
        .single();

      if (result.error && result.error.message?.includes("current_task_index")) {
        const fallback = await supabase
          .from("roadmaps")
          .select("topic, roadmap_content, created_at")
          .eq("id", roadmapId)
          .single();
        data = fallback.data;
        fe = fallback.error;
      } else {
        data = result.data;
        fe = result.error;
      }
      if (fe || !data) {
        setError("Roadmap not found");
      } else {
        setRoadmap(data);
        if (typeof (data as any).current_task_index === "number" && (data as any).current_task_index >= 0) {
          setActiveTaskIndex((data as any).current_task_index);
        }
        setIsInitialIndexLoaded(true);
      }
      setLoading(false);
    };
    fetchData();
  }, [roadmapId, router]);

  useEffect(() => {
    if (roadmap) contentRef.current = roadmap.roadmap_content;
  }, [roadmap]);

  // ── Save to database ──
  const saveToDatabase = useCallback(
    async (newContent: string) => {
      if (!roadmapId) return;
      setSaving(true);
      try {
        const { error } = await supabase
          .from("roadmaps")
          .update({ roadmap_content: newContent })
          .eq("id", roadmapId);

        if (error) {
          console.error("Save error:", error.message);
          showToast("Failed to save progress", "error");
        } else {
          showToast("Progress saved!", "success");
        }
      } catch (e: any) {
        showToast(e.message || "Failed to save progress", "error");
      } finally {
        setSaving(false);
      }
    },
    [roadmapId, showToast]
  );

  // ── Toggle line ──
  const toggleLine = useCallback(
    (lineIndex: number, isCurrentlyChecked: boolean) => {
      if (!roadmap || !roadmapId) return;
      const lines = contentRef.current.split("\n");

      if (lineIndex < 0 || lineIndex >= lines.length) return;
      if (!/^\s*[-*+]\s+\[[ xX]\]/.test(lines[lineIndex])) return;

      if (isCurrentlyChecked) {
        lines[lineIndex] = lines[lineIndex].replace(
          /^(\s*[-*+]\s+)\[[xX]\]/i,
          "$1[ ]"
        );
      } else {
        lines[lineIndex] = lines[lineIndex].replace(
          /^(\s*[-*+]\s+)\[\s?\]/,
          "$1[x]"
        );
      }

      const updated = lines.join("\n");
      contentRef.current = updated;
      setRoadmap({ ...roadmap, roadmap_content: updated });
      saveToDatabase(updated);
    },
    [roadmap, roadmapId, saveToDatabase]
  );

  // ── Background save: current_task_index ──
  const saveTaskIndex = useCallback(
    async (index: number) => {
      if (!roadmapId) return;
      const { error } = await supabase
        .from("roadmaps")
        .update({ current_task_index: index })
        .eq("id", roadmapId);
      if (error) {
        console.error("Failed to save task index:", error.message);
      }
    },
    [roadmapId]
  );

  // ── Helper: check if a task is a milestone (last task of its phase) ──
  const isMilestone = useCallback(
    (taskIndex: number): boolean => {
      if (!roadmap) return false;
      const phases = parsePhases(roadmap.roadmap_content);
      const all = flatTasks(phases);
      const task = all[taskIndex];
      if (!task) return false;
      // Find which phase this task belongs to
      for (const phase of phases) {
        const idx = phase.tasks.indexOf(task);
        if (idx !== -1) {
          // It's a milestone if it's the last task in its phase
          return idx === phase.tasks.length - 1;
        }
      }
      return false;
    },
    [roadmap, parsePhases, flatTasks]
  );

  // ── Mark complete & advance (with PoW check) ──
  const handleMarkCompleteAndNext = useCallback(async () => {
    if (!roadmap) return;
    const phases = parsePhases(roadmap.roadmap_content);
    const allTasks = flatTasks(phases);
    if (allTasks.length === 0) return;

    const current = allTasks[activeTaskIndex];
    const isMilestoneTask = isMilestone(activeTaskIndex);

    // ── Safety guard: validate task data is non-null before proceeding ──
    if (!roadmapId) {
      console.log("[handleMarkCompleteAndNext] ⚠️ Task data is invalid: roadmap_id is null/undefined. Exiting gracefully to avoid crash.");
      return;
    }
    if (activeTaskIndex === undefined || activeTaskIndex === null) {
      console.log("[handleMarkCompleteAndNext] ⚠️ Task data is invalid: task_index is null/undefined. Exiting gracefully to avoid crash.");
      return;
    }
    if (!current) {
      console.log("[handleMarkCompleteAndNext] ⚠️ No task found at index", activeTaskIndex, "– exiting gracefully.");
      return;
    }

    // ── Resolve authenticated user_id once at the top ──
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) {
      console.log("[handleMarkCompleteAndNext] ⚠️ No authenticated user found. Exiting gracefully.");
      return;
    }

    // Build payload for multimodal submission
    // Use the pre-uploaded image URL for image submissions, or upload audio files on submit
    let uploadedUrl: string | null = null;
    if (submissionType === 'image') {
      // Image was already uploaded on file selection — use the stored URL
      uploadedUrl = uploadedImageUrl;
    } else if (submissionType === 'audio' && selectedFile) {
      setPowSaving(true); // Start loading state for upload
      // Generate a unique path to avoid collisions: <userId>/<timestamp>_<filename>
      const timestamp = Date.now();
      const safeName = selectedFile.name.replace(/\s+/g, '_');
      const filePath = `${userId}/${timestamp}_${safeName}`;
      const { error: uploadErr } = await supabase.storage
        .from('pow_images')
        .upload(filePath, selectedFile);
      if (uploadErr) {
        console.error('Upload error:', uploadErr.message);
        showToast('File upload failed – please try again', 'error');
        setPowSaving(false);
        return;
      }
      // Retrieve the public URL for the uploaded file
      const { data: publicData } = supabase.storage.from('pow_images').getPublicUrl(filePath);
      uploadedUrl = publicData?.publicUrl || null;
    }

    // Build the submission payload matching the project_progress table schema
    // Use uploadedUrl for proof_url if an image was submitted, otherwise use powUrl for URL submissions
    const submittedUrl = submissionType === 'image' && uploadedUrl ? uploadedUrl : (submissionType === 'url' ? powUrl.trim() : null);
    const basePayload: any = {
      user_id: userId,
      roadmap_id: roadmapId,
      project_title: roadmap.topic,
      task_index: activeTaskIndex,
      task_text: current.text,
      proof_url: submittedUrl,
      completed_at: new Date().toISOString(),
      submission_type: submissionType,
      submission_data:
        submissionType === 'url'
          ? { url: submittedUrl }
          : submissionType === 'image' && uploadedUrl
          ? { file_url: uploadedUrl, file_name: selectedFile?.name }
          : submissionType === 'audio' && uploadedUrl
          ? { audio_url: uploadedUrl }
          : null,
    };

    // Validation for URL mode (PoW still required for milestones)
    if (isMilestoneTask && submissionType === 'url' && current && !current.checked) {
      const url = powUrl.trim();
      if (!url || !/^https?:\/\/.+/.test(url)) {
        setPowError("❌ Sahi URL daalo — http:// ya https:// se shuru hona chahiye!");
        powInputRef.current?.focus();
        return;
      }
      setPowError(null);
    }

    // Save to Supabase
    setPowSaving(true);
    const { error: saveErr } = await supabase.from("project_progress").upsert(
      basePayload,
      { onConflict: "roadmap_id, task_index" }
    );
    setPowSaving(false);

    if (saveErr) {
      console.error("Failed to save submission:", saveErr.message);
      setPowError("Database error — please try again.");
      return;
    }

    // ── Trigger AI Vision verification for image submissions ──
    if (submissionType === "image" && uploadedUrl) {
      // Fetch the saved submission ID to send to the verification API
      const { data: savedSubmission } = await supabase
        .from("project_progress")
        .select("id")
        .eq("roadmap_id", roadmapId)
        .eq("task_index", activeTaskIndex)
        .single();

      if (savedSubmission?.id) {
        setLastSubmittedImageId(savedSubmission.id);
        lastSubmittedImageUrlRef.current = uploadedUrl;
        setIsMilestoneCompleted(true);
        // Auto-trigger verification in the background
        try {
          console.log("[dashboard] Triggering PoW verification for submission:", savedSubmission.id);
          const verifyRes = await fetch("/api/verify-pow", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              submission_id: savedSubmission.id,
              image_url: uploadedUrl,
            }),
          });
          const verifyData = await verifyRes.json();
          if (verifyRes.ok) {
            setVerifyResult({
              verified: verifyData.verified,
              feedback: verifyData.feedback,
              confidence_score: verifyData.confidence_score,
            });
            showToast(
              `🔍 AI Verification: ${verifyData.verified ? "✅ Passed" : "⚠️ Needs Review"} — ${verifyData.feedback}`,
              verifyData.verified ? "success" : "error"
            );
          } else {
            console.error("[dashboard] Verification API error:", verifyData.error);
          }
        } catch (verifyErr) {
          console.error("[dashboard] Failed to call verification API:", verifyErr);
        }
      }
    }

    // Clear inputs for next task
    setPowUrl("");
    setSelectedFile(null);

    // Toggle checkbox
    if (current && !current.checked) {
      toggleLine(current.lineIndex, false);
    }

    // Advance to next task
    if (activeTaskIndex < allTasks.length - 1) {
      const nextIndex = activeTaskIndex + 1;
      setActiveTaskIndex(nextIndex);
      saveTaskIndex(nextIndex);
    } else {
      saveTaskIndex(activeTaskIndex);
    }
  }, [roadmap, parsePhases, flatTasks, activeTaskIndex, toggleLine, saveTaskIndex, isMilestone, powUrl, roadmapId, submissionType, selectedFile, uploadedImageUrl, showToast]);

  const handleSkip = useCallback(() => {
    if (!roadmap) return;
    const phases = parsePhases(roadmap.roadmap_content);
    const allTasks = flatTasks(phases);
    if (allTasks.length === 0) return;

    const nextIndex = Math.min(activeTaskIndex + 1, allTasks.length - 1);
    setActiveTaskIndex(nextIndex);
    saveTaskIndex(nextIndex);
    setPowUrl("");
    setPowError(null);
  }, [roadmap, parsePhases, flatTasks, activeTaskIndex, saveTaskIndex]);

  // ── Verification handler: calls /api/verify-pow with a saved submission ──
  const handleVerifySubmission = useCallback(async () => {
    if (!lastSubmittedImageId) {
      showToast("No submission to verify. Please upload and save first.", "error");
      return;
    }

    setVerifying(true);
    setVerifyResult(null);
    try {
      const verifyRes = await fetch("/api/verify-pow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submission_id: lastSubmittedImageId,
          image_url: lastSubmittedImageUrlRef.current,
        }),
      });
      const verifyData = await verifyRes.json();

      if (verifyRes.ok) {
        setVerifyResult({
          verified: verifyData.verified,
          feedback: verifyData.feedback,
          confidence_score: verifyData.confidence_score,
        });
        showToast(
          `🔍 AI Verification: ${verifyData.verified ? "✅ Passed" : "⚠️ Needs Review"} — ${verifyData.feedback}`,
          verifyData.verified ? "success" : "error"
        );
      } else {
        console.error("[dashboard] Verification API error:", verifyData.error);
        showToast(`Verification failed: ${verifyData.error}`, "error");
      }
    } catch (verifyErr: any) {
      console.error("[dashboard] Failed to call verification API:", verifyErr);
      showToast("Verification request failed — please try again", "error");
    } finally {
      setVerifying(false);
    }
  }, [lastSubmittedImageId, showToast]);

  // ── Upload image to pow_images bucket ──
  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPowSaving(true);
    setPowError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const timestamp = Date.now();
      const safeName = file.name.replace(/\s+/g, '_');
      const filePath = `${user.id}/${timestamp}_${safeName}`;

      const { error: uploadErr } = await supabase.storage
        .from('pow_images')
        .upload(filePath, file);

      if (uploadErr) {
        console.error('Upload error:', uploadErr.message);
        showToast('File upload failed – please try again', 'error');
        setPowSaving(false);
        return;
      }

      const { data: publicData } = supabase.storage.from('pow_images').getPublicUrl(filePath);
      const publicUrl = publicData?.publicUrl || null;
      setProofUrl(publicUrl);
      showToast('Image uploaded successfully!', 'success');
    } catch (err: any) {
      console.error('Upload error:', err.message);
      showToast('File upload failed – please try again', 'error');
    } finally {
      setPowSaving(false);
    }
  }, [showToast]);

  // ── Reset PoW + verification state when task changes ──
  useEffect(() => {
    setPowUrl("");
    setPowError(null);
    setVerifyResult(null);
    setVerifying(false);
    setLastSubmittedImageId(null);
    lastSubmittedImageUrlRef.current = null;
    setIsMilestoneCompleted(false);
    setSelectedFile(null);
    setUploadedImageUrl(null);
    setImageUploading(false);
  }, [activeTaskIndex]);

  // ── Send chat message with streaming ──
  const handleSendMessage = useCallback(async () => {
    const trimmed = chatInput.trim();
    if (!trimmed || isChatLoading || !roadmap) return;

    const phases = parsePhases(roadmap.roadmap_content);
    const all = flatTasks(phases);
    const task = all[activeTaskIndex];
    if (!task) return;

    const userMsg = trimmed;
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user" as const, content: userMsg }]);
    setIsChatLoading(true);
    setStreamingContent("");
    setShouldAutoScroll(true);

    try {
      const res = await fetch("/api/task-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: roadmap.topic,
          currentTask: task.text,
          userMessage: userMsg,
          roadmapId,
          taskIndex: activeTaskIndex,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error((errData as { error?: string }).error || `Request failed (${res.status})`);
      }

      // Read the streaming response
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        // Parse SSE format: "data: {...}\n\n"
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const delta =
                parsed.choices?.[0]?.delta?.content ||
                parsed.choices?.[0]?.text ||
                "";
              if (delta) {
                accumulated += delta;
                setStreamingContent(accumulated);
              }
            } catch {
              // Skip malformed JSON lines
            }
          }
        }
      }

      // Streaming complete — finalize the AI message
      if (accumulated) {
        // Success — reset retry tracking
        setRetryCount(0);
        setLastError(null);
        setChatMessages((prev) => {
          const updated = [...prev, { role: "ai" as const, content: accumulated }];
          // Save to Supabase in the background (reset retry fields on success)
          supabase
            .from("task_chats")
            .upsert(
              {
                roadmap_id: roadmapId,
                task_index: activeTaskIndex,
                messages: updated,
                retry_count: 0,
                last_error: null,
                is_stuck: false,
              },
              { onConflict: "roadmap_id, task_index" }
            )
            .then(({ error }) => {
              if (error) console.error("Failed to save chat history:", error.message);
            });
          return updated;
        });
        setStreamingContent("");
      } else {
        throw new Error("Empty response from AI");
      }
    } catch (err: any) {
      const errMsg = err.message || "Network error. Please check your connection and try again.";
      setChatMessages((prev) => [
        ...prev,
        { role: "ai" as const, content: errMsg },
      ]);
      setStreamingContent("");

      // ── SOS Protocol: increment retry_count & track error ──
      const newRetryCount = retryCount + 1;
      const newIsStuck = newRetryCount >= retryThreshold;
      setRetryCount(newRetryCount);
      setLastError(errMsg);
      setIsStuck(newIsStuck);

      // Persist the updated retry tracking to the database
      supabase
        .from("task_chats")
        .upsert(
          {
            roadmap_id: roadmapId,
            task_index: activeTaskIndex,
            retry_count: newRetryCount,
            last_error: errMsg,
            is_stuck: newIsStuck,
          },
          { onConflict: "roadmap_id, task_index" }
        )
        .then(({ error }) => {
          if (error) console.error("Failed to save AI context state:", error.message);
        });
    } finally {
      setIsChatLoading(false);
    }
  }, [chatInput, isChatLoading, roadmap, activeTaskIndex, parsePhases, flatTasks, roadmapId, retryCount, retryThreshold]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // ── Navigate to a specific task from the sidebar ──
  const handleSidebarNav = useCallback(
    (index: number) => {
      setActiveTaskIndex(index);
      saveTaskIndex(index);
      setMobileSidebarOpen(false);
    },
    [saveTaskIndex]
  );

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  // ── Render: Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Render: Error ──
  if (error || !roadmap) {
    return (
      <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center gap-4 text-white/60">
        <p>{error || "Roadmap not found"}</p>
        <button
          onClick={() => router.push("/dashboard")}
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm transition-all"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  // ── Derived data ──
  const stats = calcStats(roadmap.roadmap_content);
  const phases = parsePhases(roadmap.roadmap_content);
  const allTasks = flatTasks(phases);
  const currentTask = allTasks[activeTaskIndex] || null;
  const isMilestoneTask = currentTask ? isMilestone(activeTaskIndex) : false;
  const needsPoW = isMilestoneTask && currentTask && !currentTask.checked;
  // PoW validation: URL needs valid URL, image needs a file selected, audio needs a file selected
  const isPoWValid = submissionType === 'url'
    ? /^https?:\/\/.+/.test(powUrl.trim())
    : submissionType === 'image'
    ? selectedFile !== null
    : submissionType === 'audio'
    ? selectedFile !== null
    : true;

  return (
    <div className="min-h-screen bg-brand-bg text-white">
      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-xl border text-sm font-medium ${
              toast.type === "success"
                ? "bg-green-500/15 border-green-500/30 text-green-300"
                : "bg-red-500/15 border-red-500/30 text-red-300"
            }`}
          >
            <div className="flex items-center gap-2">
              {toast.type === "success" ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" x2="12" y1="8" y2="12" />
                  <line x1="12" x2="12.01" y1="16" y2="16" />
                </svg>
              )}
              {toast.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <header className="border-b border-white/5 bg-black/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-sm text-white/40 hover:text-white transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back to Dashboard
          </button>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs text-white/50">
              <div className="h-1.5 w-20 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${stats.pct}%` }}
                />
              </div>
              <span className="font-mono text-violet-300">
                {stats.done}/{stats.total}
              </span>
            </div>

            {saving && (
              <div className="flex items-center gap-1.5 text-xs text-white/40">
                <div className="w-3 h-3 border-[1.5px] border-violet-500 border-t-transparent rounded-full animate-spin" />
                Saving...
              </div>
            )}

            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center font-bold text-xs">
              S
            </div>
            <span className="font-semibold text-sm hidden sm:inline">
              SIR <span className="text-violet-400">AI</span>
            </span>
          </div>
        </div>
      </header>

      {/* ── Mobile sidebar toggle ── */}
      <button
        onClick={() => setMobileSidebarOpen(true)}
        className="fixed bottom-6 right-6 z-50 md:hidden w-14 h-14 rounded-full bg-violet-600 shadow-2xl shadow-violet-900/50 border border-violet-500/30 flex items-center justify-center text-white hover:bg-violet-500 active:scale-95 transition-all"
        aria-label="Show task list"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="8" x2="21" y1="6" y2="6" />
          <line x1="8" x2="21" y1="12" y2="12" />
          <line x1="8" x2="21" y1="18" y2="18" />
          <line x1="3" x2="3.01" y1="6" y2="6" />
          <line x1="3" x2="3.01" y1="12" y2="12" />
          <line x1="3" x2="3.01" y1="18" y2="18" />
        </svg>
      </button>

      {/* ── Mobile sidebar overlay ── */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 md:hidden bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
          >
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute left-0 top-0 bottom-0 w-72 max-w-[80vw] bg-zinc-950 border-r border-white/10 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white/80 tracking-wide">
                  {roadmap.topic}
                </h2>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-3 text-xs text-white/30">{fmtDate(roadmap.created_at)}</div>
              <nav className="px-3 pb-4 space-y-1">
                {phases.map((phase, pIdx) => (
                  <div key={pIdx} className="mb-2">
                    <div className="px-2 py-1.5 text-xs font-medium text-white/40 uppercase tracking-wider">
                      {phase.title}
                    </div>
                    <div className="ml-1 space-y-0.5">
                      {phase.tasks.map((task, tIdx) => {
                        const globalIdx = allTasks.indexOf(task);
                        const isActive = globalIdx === activeTaskIndex;
                        return (
                          <button
                            key={tIdx}
                            onClick={() => handleSidebarNav(globalIdx)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all duration-200 ${
                              isActive
                                ? "bg-violet-500/15 text-violet-200 border border-violet-500/30"
                                : task.checked
                                ? "text-green-400/60 line-through"
                                : "text-white/40 hover:text-white/70 hover:bg-white/5"
                            }`}
                          >
                            <span className="truncate block">
                              {task.checked && "✓ "}
                              {task.text}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Grid Layout: Sidebar + Focus Area ── */}
      <div className="flex h-[calc(100dvh-57px)]">
        {/* ── LEFT SIDEBAR ── */}
        <aside className="hidden md:flex md:w-1/3 lg:w-[30%] xl:w-[28%] flex-col border-r border-white/5 bg-black/10 overflow-y-auto">
          <div className="p-4 border-b border-white/5">
            <h2 className="text-sm font-semibold text-white/80 tracking-wide">
              {roadmap.topic}
            </h2>
            <p className="text-xs text-white/30 mt-0.5">
              {fmtDate(roadmap.created_at)}
            </p>
          </div>
          <nav className="flex-1 p-3 space-y-1">
            {phases.map((phase, pIdx) => (
              <div key={pIdx} className="mb-2">
                <div className="px-2 py-1.5 text-xs font-medium text-white/40 uppercase tracking-wider">
                  {phase.title}
                </div>
                <div className="ml-1 space-y-0.5">
                  {phase.tasks.map((task, tIdx) => {
                    const globalIdx = allTasks.indexOf(task);
                    const isActive = globalIdx === activeTaskIndex;
                    return (
                      <button
                        key={tIdx}
                        onClick={() => handleSidebarNav(globalIdx)}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all duration-200 ${
                          isActive
                            ? "bg-violet-500/15 text-violet-200 border border-violet-500/30"
                            : task.checked
                            ? "text-green-400/60 line-through"
                            : "text-white/40 hover:text-white/70 hover:bg-white/5"
                        }`}
                      >
                        <span className="truncate block">
                          {task.checked && "✓ "}
                          {task.text}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {phases.length === 0 && (
              <p className="text-xs text-white/30 px-2 py-4 text-center">
                No tasks found in this roadmap.
              </p>
            )}
          </nav>
        </aside>

        {/* ── MAIN FOCUS AREA ── */}
        <main className="flex-1 flex flex-col overflow-y-auto">
          <div className="flex-1 p-4 md:p-6 lg:p-8 max-w-4xl mx-auto w-full">
            {currentTask ? (
              <div className="space-y-6">
                {/* Active Task Card */}
                <motion.div
                  key={activeTaskIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 120, damping: 14 }}
                  className="relative overflow-hidden rounded-2xl border border-slate-800 bg-brand-card backdrop-blur-xl shadow-2xl shadow-violet-950/30"
                >
                  <div className="pointer-events-none absolute -top-20 -right-20 w-40 h-40 rounded-full bg-violet-600/15 blur-[80px]" aria-hidden />
                  <div className="relative p-6 md:p-8 lg:p-10">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-300 text-xs font-medium">
                        Task {activeTaskIndex + 1} of {allTasks.length}
                      </span>
                      {currentTask.checked && (
                        <span className="px-2.5 py-0.5 rounded-full bg-green-500/15 border border-green-500/30 text-green-300 text-xs font-medium">
                          Completed
                        </span>
                      )}
                    </div>

                    <h3
                      className={`text-2xl md:text-3xl lg:text-4xl font-bold leading-snug tracking-tight ${
                        currentTask.checked ? "line-through text-white/40" : "text-white"
                      }`}
                    >
                      {currentTask.text}
                    </h3>

                    {/* ── Proof of Work Section (Milestone tasks only) ── */}
                     {needsPoW && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-6 p-5 rounded-2xl border border-amber-500/30 bg-amber-500/5"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-xl mt-0.5">🔒</span>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-amber-300 mb-1">
                              Phase Milestone — Proof of Work Required
                            </h4>
                            <p className="text-xs text-amber-300/60 mb-3">
                              Bina Proof of Work ke aage nahi badh sakte! Apna live project ya code ka link share karo.
                            </p>
                             {/* ── Submission Type Selector ── */}
                             <div className="flex gap-2 mb-4">
                               {(['url', 'image', 'audio'] as const).map((type) => (
                                 <button
                                   key={type}
                                   type="button"
                                   onClick={() => setSubmissionType(type)}
                                   className={`px-3 py-1 rounded ${submissionType === type ? 'bg-brand-primary text-white' : 'bg-gray-700 text-gray-300'} transition`}
                                 >
                                   {type.toUpperCase()}
                                 </button>
                               ))}
                             </div>
                             {/* Conditional input based on submission type */}
                             {submissionType === 'url' && (
                               <input
                                 ref={powInputRef}
                                 type="url"
                                 value={powUrl}
                                 onChange={(e) => {
                                   setPowUrl(e.target.value);
                                   setPowError(null);
                                 }}
                                 placeholder="https://github.com/... ya https://your-project.vercel.app"
                                 className="w-full px-4 py-3 rounded-xl bg-[#050508]/80 border border-amber-500/20 text-sm text-white placeholder:text-white/20 outline-none focus:border-amber-500/50 transition-all"
                               />
                             )}
                             {submissionType === 'image' && (
                               <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 bg-brand-card/50 p-6 rounded-xl">
                                 {imageUploading ? (
                                   <div className="flex flex-col items-center gap-2">
                                     <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                                     <span className="text-sm text-gray-300">Uploading image...</span>
                                   </div>
                                 ) : selectedFile && uploadedImageUrl ? (
                                   <div className="flex flex-col items-center gap-2">
                                     <img src={URL.createObjectURL(selectedFile)} alt="preview" className="max-h-32 rounded" />
                                     <span className="text-xs text-green-400">✅ Uploaded</span>
                                     <button
                                       type="button"
                                       onClick={() => {
                                         setSelectedFile(null);
                                         setUploadedImageUrl(null);
                                       }}
                                       className="px-2 py-1 bg-red-600 text-white rounded"
                                     >
                                       Remove
                                     </button>
                                   </div>
                                 ) : (
                                   <label className="cursor-pointer flex flex-col items-center">
                                     <span className="text-sm text-gray-300 mb-2">Drag & drop or click to upload</span>
                                     <input
                                       type="file"
                                       accept="image/*"
                                       className="hidden"
                                       onChange={(e) => {
                                         handleImageUpload(e);
                                       }}
                                     />
                                   </label>
                                 )}
                               </div>
                             )}
                             {submissionType === 'audio' && (
                               <div className="flex items-center gap-2 p-4 border-2 border-dashed border-slate-700 bg-brand-card/50 rounded-xl">
                                 <button
                                   type="button"
                                   className="px-3 py-1 bg-brand-primary text-white rounded"
                                   onClick={() => {
                                     // Mock recording – in real implementation hook MediaRecorder
                                     alert('Recording started (mock)');
                                   }}
                                 >
                                   Start Recording
                                 </button>
                                 <span className="text-sm text-gray-300">(Audio capture mock)</span>
                               </div>
                             )}
                            {powError && (
                              <p className="mt-2 text-xs text-red-400">{powError}</p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    <div className="my-6 h-px bg-gradient-to-r from-violet-500/30 via-blue-500/20 to-transparent" />

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-white/70 mb-2">Upload Proof (Image)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="w-full px-4 py-3 rounded-xl bg-[#050508]/80 border border-white/10 text-sm text-white outline-none focus:border-violet-500/50 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-600 file:text-white hover:file:bg-violet-500"
                      />
                      {proofUrl && (
                        <p className="mt-1 text-xs text-green-400">✓ Image uploaded: {proofUrl}</p>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={handleMarkCompleteAndNext}
                        disabled={
                          allTasks.length === 0 ||
                          powSaving ||
                          (needsPoW && !isPoWValid)
                        }
                        className="group relative w-full sm:flex-1 py-4 sm:py-3.5 px-6 rounded-xl font-semibold text-white overflow-hidden transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
                      >
                        <span className="absolute inset-0 bg-brand-primary" />
                        <span className="absolute inset-0 bg-brand-primary opacity-0 group-hover:opacity-90 transition-opacity duration-300" />
                        <span className="relative flex items-center justify-center gap-2">
                          {powSaving ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Saving Proof...
                            </>
                          ) : activeTaskIndex < allTasks.length - 1 ? (
                            <>
                              {needsPoW && "🔒 "}Mark Complete & Next
                            </>
                          ) : (
                            "Mark Complete"
                          )}
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-0.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </span>
                      </button>

                      {!currentTask.checked && (
                        <button
                          onClick={handleSkip}
                          className="px-5 py-3.5 rounded-xl border border-white/10 bg-white/5 text-white/60 hover:text-white/90 hover:bg-white/10 transition-all text-sm font-medium"
                        >
                          Skip
                        </button>
                      )}
                    </div>

                    {/* ── AI Verification Status & Button ── */}
                    {(isMilestoneCompleted || verifyResult) && submissionType === "image" && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-4 rounded-xl border border-violet-500/20 bg-violet-500/5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Verification status badge */}
                            {verifyResult === null && verifying ? (
                              <div className="flex items-center gap-2 text-sm text-violet-300">
                                <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                                AI is thinking... analyzing your submission
                              </div>
                            ) : verifyResult ? (
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={`shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full text-sm ${
                                  verifyResult.verified
                                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                    : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                }`}>
                                  {verifyResult.verified ? "✅" : "⚠️"}
                                </span>
                                <div className="min-w-0">
                                  <span className={`text-sm font-semibold ${
                                    verifyResult.verified ? "text-green-400" : "text-amber-400"
                                  }`}>
                                    {verifyResult.verified ? "Verified" : "Needs Review"}
                                  </span>
                                  <p className="text-xs text-white/50 mt-0.5 truncate">
                                    {verifyResult.feedback}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-white/50">Ready for AI verification</span>
                            )}
                          </div>

                          {!verifyResult && (
                            <button
                              onClick={handleVerifySubmission}
                              disabled={verifying}
                              className="shrink-0 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                            >
                              {verifying ? (
                                <span className="flex items-center gap-1.5">
                                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  Thinking...
                                </span>
                              ) : (
                                "Submit for Verification"
                              )}
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>

                {/* ── CHAT UI ── */}
                <div className="rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl shadow-xl overflow-hidden">
                  {/* Chat header */}
                  <div className="px-5 py-3 border-b border-white/5 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center text-[10px] font-bold">
                      S
                    </div>
                    <span className="text-sm font-medium text-white/70">
                      Task Assistant
                    </span>
                  </div>

                  {/* Chat messages area */}
                  <div
                    ref={chatContainerRef}
                    onScroll={handleChatScroll}
                    className="p-5 min-h-[180px] max-h-[300px] sm:max-h-[360px] overflow-y-auto space-y-3"
                  >
                    {chatMessages.map((msg, idx) => (
                      <motion.div
                        key={`${idx}-${msg.role}`}
                        initial={{ opacity: 0, y: 12, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className={`flex items-start gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                      >
                        {msg.role === "ai" ? (
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                            S
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-zinc-700 border border-white/10 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 text-white/60">
                            U
                          </div>
                        )}
                        <div className="flex-1 max-w-[85%]">
                          <div
                            className={`p-3 rounded-xl text-sm leading-relaxed prose prose-invert prose-sm max-w-none ${
                              msg.role === "ai"
                                ? "bg-zinc-800/60 border border-white/5 text-white/70"
                                : "bg-violet-600/20 border border-violet-500/30 text-violet-200"
                            }`}
                          >
                            {msg.role === "ai" ? (
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  ul: ({ ...props }) => (
                                    <ul className="list-disc ml-5 mt-2 space-y-1" {...props} />
                                  ),
                                  ol: ({ ...props }) => (
                                    <ol className="list-decimal ml-5 mt-2 space-y-1" {...props} />
                                  ),
                                  li: ({ ...props }) => (
                                    <li className="text-white/80" {...props} />
                                  ),
                                  p: ({ ...props }) => (
                                    <p className="mb-2 last:mb-0" {...props} />
                                  ),
                                  strong: ({ ...props }) => (
                                    <strong className="font-semibold text-white" {...props} />
                                  ),
                                  code: ({ ...props }) => (
                                    <code className="px-1 py-0.5 rounded bg-white/10 text-sm text-violet-300" {...props} />
                                  ),
                                }}
                              >
                                {msg.content}
                              </ReactMarkdown>
                            ) : (
                              <span className="whitespace-pre-wrap">{msg.content}</span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    {/* Streaming message bubble */}
                    {isChatLoading && streamingContent && (
                      <motion.div
                        key="streaming"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-start gap-3"
                      >
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                          S
                        </div>
                        <div className="flex-1 max-w-[85%]">
                          <div className="p-3 rounded-xl text-sm leading-relaxed bg-zinc-800/60 border border-white/5 text-white/70 prose prose-invert prose-sm max-w-none">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                ul: ({ ...props }) => <ul className="list-disc ml-5 mt-2 space-y-1" {...props} />,
                                ol: ({ ...props }) => <ol className="list-decimal ml-5 mt-2 space-y-1" {...props} />,
                                li: ({ ...props }) => <li className="text-white/80" {...props} />,
                                p: ({ ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                strong: ({ ...props }) => <strong className="font-semibold text-white" {...props} />,
                                code: ({ ...props }) => <code className="px-1 py-0.5 rounded bg-white/10 text-sm text-violet-300" {...props} />,
                              }}
                            >
                              {streamingContent + " ▌"}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Thinking indicator */}
                    {isChatLoading && !streamingContent && (
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                          S
                        </div>
                        <div className="flex-1 max-w-[85%]">
                          <div className="p-3 rounded-xl bg-zinc-800/60 border border-white/5">
                            <div className="flex items-center gap-2 text-xs text-white/40">
                              <div className="w-3 h-3 border-[1.5px] border-violet-500 border-t-transparent rounded-full animate-spin" />
                              Thinking...
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={chatEndRef} />
                  </div>

                  {/* Input area */}
                  <div className="p-4 border-t border-white/5">
                    <div className="flex gap-2 items-end">
                      <textarea
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask a question about this task... (Enter to send, Shift+Enter for new line)"
                        disabled={isChatLoading}
                        rows={1}
                        className="flex-1 px-4 py-3 rounded-xl bg-zinc-800/60 border border-white/10 text-sm text-white placeholder:text-white/20 outline-none focus:border-violet-500/40 transition-colors disabled:opacity-50 resize-none min-h-[44px] max-h-[120px] leading-relaxed"
                        style={{ height: "auto" }}
                        onInput={(e) => {
                          const el = e.currentTarget;
                          el.style.height = "auto";
                          el.style.height = Math.min(el.scrollHeight, 120) + "px";
                        }}
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!chatInput.trim() || isChatLoading}
                        className="px-5 py-3 rounded-xl bg-violet-600 border border-violet-500/30 text-white text-sm font-medium hover:bg-violet-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 shrink-0"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 2L11 13" />
                          <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Mastery banner */}
                {stats.pct === 100 && stats.total > 0 && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="p-5 rounded-2xl bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/50 text-center"
                  >
                    <span className="text-3xl">🏆</span>
                    <h4 className="text-yellow-400 font-bold text-lg mt-1">
                      MASTERY ACHIEVED!
                    </h4>
                    <p className="text-yellow-200/70 text-sm">
                      You have conquered this roadmap!
                    </p>
                  </motion.div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-white/30">
                  <p className="text-lg">No tasks found</p>
                  <p className="text-sm mt-1">
                    This roadmap appears to be empty.
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
