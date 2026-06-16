"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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

  // ── Chat state ──
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "ai"; content: string }[]>([
    { role: "ai", content: "Need help with this step? Ask me here!" },
  ]);
  const [chatHistoryLoaded, setChatHistoryLoaded] = useState(false);

  // ── Fetch / clear chat history when task changes ──
  useEffect(() => {
    if (!roadmapId || !isInitialIndexLoaded) return;

    const fetchChatHistory = async () => {
      // Clear the previous task's chat from the UI first
      setChatMessages([{ role: "ai", content: "Need help with this step? Ask me here!" }]);
      setChatHistoryLoaded(false);

      const { data, error } = await supabase
        .from("task_chats")
        .select("messages")
        .eq("roadmap_id", roadmapId)
        .eq("task_index", activeTaskIndex)
        .single();

      if (!error && data?.messages && Array.isArray(data.messages) && data.messages.length > 0) {
        setChatMessages(data.messages);
      }
      setChatHistoryLoaded(true);
    };

    fetchChatHistory();
  }, [roadmapId, activeTaskIndex, isInitialIndexLoaded]);

  const [inputValue, setInputValue] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // ── Parse roadmap into phases with tasks ──
  const parsePhases = useCallback((markdown: string): PhaseGroup[] => {
    const lines = markdown.split("\n");
    const groups: PhaseGroup[] = [];
    let currentPhaseTitle = "Overview";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Detect phase headers
      const phaseMatch = trimmed.match(
        /^#{2,4}\s+(Phase\s+\d+[:\s\-\–—]*(.*))/i
      );
      if (phaseMatch) {
        currentPhaseTitle = phaseMatch[1]
          .replace(/[*#]/g, "")
          .trim();
        groups.push({ title: currentPhaseTitle, tasks: [] });
        continue;
      }

      // Also detect bold phase headers like **Phase 1: ...**
      const boldMatch = trimmed.match(
        /^\*\*Phase\s+\d+[:\s\-\–—]*(.*?)\*\*/i
      );
      if (boldMatch) {
        currentPhaseTitle = trimmed.replace(/^\*\*|\*\*$/g, "").trim();
        groups.push({ title: currentPhaseTitle, tasks: [] });
        continue;
      }

      // Detect checkbox lines
      const checkboxMatch = trimmed.match(/^[-*+]\s+\[([ xX])\]\s+(.*)/);
      if (checkboxMatch) {
        const checked = checkboxMatch[1].toLowerCase() === "x";
        const taskText = checkboxMatch[2];
        // Add to current phase group, or create "Overview" if no phase yet
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

    // If no phases found, put all tasks in "Tasks"
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
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/");
        return;
      }
      if (!roadmapId) {
        setError("Invalid roadmap ID");
        setLoading(false);
        return;
      }
      // Try with current_task_index first; fallback if column doesn't exist
      let data: any;
      let fe: any;

      const result = await supabase
        .from("roadmaps")
        .select("topic, roadmap_content, created_at, current_task_index")
        .eq("id", roadmapId)
        .single();

      if (result.error && result.error.message?.includes("current_task_index")) {
        // Column doesn't exist yet — query without it
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
        // Restore saved task index if valid (column may not exist yet)
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
      // Optimistic — no loading state to keep it seamless
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

  // ── Mark complete & advance ──
  const handleMarkCompleteAndNext = useCallback(() => {
    if (!roadmap) return;
    const phases = parsePhases(roadmap.roadmap_content);
    const allTasks = flatTasks(phases);
    if (allTasks.length === 0) return;

    const current = allTasks[activeTaskIndex];
    // Check the box if not already checked
    if (current && !current.checked) {
      toggleLine(current.lineIndex, false);
    }

    if (activeTaskIndex < allTasks.length - 1) {
      const nextIndex = activeTaskIndex + 1;
      setActiveTaskIndex(nextIndex);
      saveTaskIndex(nextIndex);
    } else {
      // Last task — still save the final index
      saveTaskIndex(activeTaskIndex);
    }
  }, [roadmap, parsePhases, flatTasks, activeTaskIndex, toggleLine, saveTaskIndex]);

  // ── Skip: just advance without checking ──
  const handleSkip = useCallback(() => {
    if (!roadmap) return;
    const phases = parsePhases(roadmap.roadmap_content);
    const allTasks = flatTasks(phases);
    if (allTasks.length === 0) return;

    const nextIndex = Math.min(activeTaskIndex + 1, allTasks.length - 1);
    setActiveTaskIndex(nextIndex);
    saveTaskIndex(nextIndex);
  }, [roadmap, parsePhases, flatTasks, activeTaskIndex, saveTaskIndex]);

  // ── Send chat message ──
  const handleSendMessage = useCallback(async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isChatLoading || !roadmap) return;

    // Derive the current task from roadmap content inline
    const phases = parsePhases(roadmap.roadmap_content);
    const all = flatTasks(phases);
    const task = all[activeTaskIndex];
    if (!task) return;

    const userMsg = trimmed;
    setInputValue("");
    setChatMessages((prev) => [...prev, { role: "user" as const, content: userMsg }]);
    setIsChatLoading(true);

    try {
      const res = await fetch("/api/task-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: roadmap.topic,
          currentTask: task.text,
          userMessage: userMsg,
        }),
      });

      const data = await res.json();
      const reply = data.reply || data.message;
      if (res.ok && reply) {
        setChatMessages((prev) => {
          const updated = [...prev, { role: "ai" as const, content: reply }];
          // Background upsert to Supabase — non-blocking
          supabase
            .from("task_chats")
            .upsert(
              { roadmap_id: roadmapId, task_index: activeTaskIndex, messages: updated },
              { onConflict: "roadmap_id, task_index" }
            )
            .then(({ error }) => {
              if (error) console.error("Failed to save chat history:", error.message);
            });
          return updated;
        });
      } else {
        setChatMessages((prev) => {
          const updated = [
            ...prev,
            { role: "ai" as const, content: "Sorry, I couldn't process that. Please try again." },
          ];
          supabase
            .from("task_chats")
            .upsert(
              { roadmap_id: roadmapId, task_index: activeTaskIndex, messages: updated },
              { onConflict: "roadmap_id, task_index" }
            )
            .then(({ error }) => {
              if (error) console.error("Failed to save chat history:", error.message);
            });
          return updated;
        });
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: "ai" as const, content: "Network error. Please check your connection and try again." },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  }, [inputValue, isChatLoading, roadmap, activeTaskIndex, parsePhases, flatTasks]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
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

  // ── Date formatting ──
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  // ── Render: Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Render: Error ──
  if (error || !roadmap) {
    return (
      <div className="min-h-screen bg-[#050508] flex flex-col items-center justify-center gap-4 text-white/60">
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

  return (
    <div className="min-h-screen bg-[#050508] text-white">
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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back to Dashboard
          </button>

          <div className="flex items-center gap-3">
            {/* Progress badge */}
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
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
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
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
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
        {/* ── LEFT SIDEBAR (w-1/3, hidden on mobile) ── */}
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
                {/* Phase title */}
                <div className="px-2 py-1.5 text-xs font-medium text-white/40 uppercase tracking-wider">
                  {phase.title}
                </div>

                {/* Tasks within this phase */}
                <div className="ml-1 space-y-0.5">
                  {phase.tasks.map((task, tIdx) => {
                    const globalIdx =
                      allTasks.indexOf(task);
                    const isActive = globalIdx === activeTaskIndex;
                    return (
                      <button
                        key={tIdx}
                        onClick={() =>
                          handleSidebarNav(globalIdx)
                        }
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

        {/* ── MAIN FOCUS AREA (w-2/3) ── */}
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
                  className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 backdrop-blur-xl shadow-2xl shadow-violet-950/30"
                >
                  {/* Glow */}
                  <div
                    className="pointer-events-none absolute -top-20 -right-20 w-40 h-40 rounded-full bg-violet-600/15 blur-[80px]"
                    aria-hidden
                  />

                  <div className="relative p-6 md:p-8 lg:p-10">
                    {/* Task index label */}
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

                    {/* Task text — large, premium */}
                    <h3
                      className={`text-2xl md:text-3xl lg:text-4xl font-bold leading-snug tracking-tight ${
                        currentTask.checked
                          ? "line-through text-white/40"
                          : "text-white"
                      }`}
                    >
                      {currentTask.text}
                    </h3>

                    {/* Divider */}
                    <div className="my-6 h-px bg-gradient-to-r from-violet-500/30 via-blue-500/20 to-transparent" />

                    {/* Action buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={handleMarkCompleteAndNext}
                        disabled={allTasks.length === 0}
                        className="group relative w-full sm:flex-1 py-4 sm:py-3.5 px-6 rounded-xl font-semibold text-white overflow-hidden transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
                      >
                        <span className="absolute inset-0 bg-gradient-to-r from-violet-600 to-blue-600" />
                        <span className="absolute inset-0 bg-gradient-to-r from-violet-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <span className="relative flex items-center justify-center gap-2">
                          {activeTaskIndex < allTasks.length - 1
                            ? "Mark Complete & Next"
                            : "Mark Complete"}
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="transition-transform group-hover:translate-x-0.5"
                          >
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
                  <div className="p-5 min-h-[160px] max-h-[260px] sm:max-h-[320px] overflow-y-auto space-y-3">
                    {chatMessages.map((msg, idx) => (
                      <div
                        key={idx}
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
                      </div>
                    ))}
                    {isChatLoading && (
                      <div className="flex items-center gap-2 text-xs text-white/40 ml-10">
                        <div className="w-3 h-3 border-[1.5px] border-violet-500 border-t-transparent rounded-full animate-spin" />
                        Thinking...
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Input area */}
                  <div className="p-4 border-t border-white/5">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask a question about this task..."
                        disabled={isChatLoading}
                        className="flex-1 px-4 py-3 sm:py-2.5 rounded-xl bg-zinc-800/60 border border-white/10 text-sm text-white placeholder:text-white/20 outline-none focus:border-violet-500/40 transition-colors disabled:opacity-50"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim() || isChatLoading}
                        className="px-5 py-3 sm:py-2.5 rounded-xl bg-violet-600 border border-violet-500/30 text-white text-sm font-medium hover:bg-violet-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
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