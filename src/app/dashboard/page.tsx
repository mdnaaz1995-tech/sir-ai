"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

// --- SVG Icons (kept minimal — only what's needed) ---

const RoadmapIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18" />
    <path d="m19 9-5 5-4-4-3 3" />
  </svg>
);

const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const LogoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" x2="9" y1="12" y2="12" />
  </svg>
);

const BookOpenIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
  </svg>
);

const BrainIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a4 4 0 0 1 4 4c0 2-2 3-2 5 0 1.5 1.5 2 3 3 1.5 1 2 2.5 2 4.5a4 4 0 0 1-4 4c-2 0-3-1.5-4-3.5-1 2-2 3.5-4 3.5a4 4 0 0 1-4-4c0-2 .5-3.5 2-4.5 1.5-1 3-1.5 3-3 0-2-2-3-2-5a4 4 0 0 1 4-4z" />
  </svg>
);

const CodeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
);

const RocketIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
    <path d="M12 15l-3-3c-1.66-2.23-3-5.39-3-8 4.08 0 7.14 1.34 9 3l3 3" />
    <path d="M16.5 11.5c.63.84 1.49 1.92 1.49 3.5 0 1.1-.4 2.1-1 3" />
    <path d="M19 15c.55.88 1 2 1 3 0 1.1-.45 2.1-1 3" />
    <path d="M21 18c.33.66.5 1.5.5 2.5 0 .9-.2 1.7-.5 2.5" />
    <path d="M12 12l3 3" />
  </svg>
);

const DatabaseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
  </svg>
);

const PaletteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
    <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
    <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
    <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.5-.6 1.5-1.5 0-.4-.15-.75-.4-1.05-.25-.3-.4-.65-.4-1.05 0-.9.6-1.5 1.5-1.5H16c3.3 0 6-2.7 6-6 0-5.5-4.5-10-10-10z" />
  </svg>
);

const ChartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" x2="18" y1="20" y2="10" />
    <line x1="12" x2="12" y1="20" y2="4" />
    <line x1="6" x2="6" y1="20" y2="14" />
  </svg>
);

const GlobeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" x2="22" y1="12" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const ShieldIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2s8 4 8 10v4l-8 4-8-4v-4c0-6 8-10 8-10z" />
  </svg>
);

// ── Topic → icon mapping for beautiful card badges ──
const topicIcons: Record<string, React.ReactNode> = {
  "brain": <BrainIcon />,
  "code": <CodeIcon />,
  "database": <DatabaseIcon />,
  "design": <PaletteIcon />,
  "analytics": <ChartIcon />,
  "web": <GlobeIcon />,
  "security": <ShieldIcon />,
  "rocket": <RocketIcon />,
};
const defaultIcon = <BookOpenIcon />;

const getIconForTopic = (topic: string): React.ReactNode => {
  const lower = topic.toLowerCase();
  if (lower.includes("python") || lower.includes("javascript") || lower.includes("typescript") || lower.includes("rust") || lower.includes("go ") || lower.includes("java") || lower.includes("c++")) return <CodeIcon />;
  if (lower.includes("ai") || lower.includes("machine learning") || lower.includes("deep learning") || lower.includes("neural") || lower.includes("llm") || lower.includes("nlp")) return <BrainIcon />;
  if (lower.includes("sql") || lower.includes("database") || lower.includes("postgres") || lower.includes("mongodb") || lower.includes("redis")) return <DatabaseIcon />;
  if (lower.includes("design") || lower.includes("ui") || lower.includes("ux") || lower.includes("figma")) return <PaletteIcon />;
  if (lower.includes("data") || lower.includes("analytics") || lower.includes("bi ")) return <ChartIcon />;
  if (lower.includes("web") || lower.includes("react") || lower.includes("next") || lower.includes("frontend") || lower.includes("fullstack") || lower.includes("node")) return <GlobeIcon />;
  if (lower.includes("security") || lower.includes("cyber") || lower.includes("penetration")) return <ShieldIcon />;
  if (lower.includes("devops") || lower.includes("cloud") || lower.includes("aws") || lower.includes("docker") || lower.includes("kubernetes") || lower.includes("ci/cd")) return <RocketIcon />;
  return defaultIcon;
};

const getIconGradient = (topic: string): string => {
  const lower = topic.toLowerCase();
  if (lower.includes("python") || lower.includes("javascript") || lower.includes("typescript") || lower.includes("rust") || lower.includes("go ") || lower.includes("java")) return "from-cyan-500 to-blue-600";
  if (lower.includes("ai") || lower.includes("machine learning") || lower.includes("deep learning") || lower.includes("neural") || lower.includes("llm") || lower.includes("nlp")) return "from-violet-500 to-fuchsia-600";
  if (lower.includes("sql") || lower.includes("database") || lower.includes("postgres") || lower.includes("mongodb")) return "from-amber-500 to-orange-600";
  if (lower.includes("design") || lower.includes("ui") || lower.includes("ux")) return "from-pink-500 to-rose-600";
  if (lower.includes("data") || lower.includes("analytics")) return "from-emerald-500 to-teal-600";
  if (lower.includes("web") || lower.includes("react") || lower.includes("next") || lower.includes("frontend") || lower.includes("fullstack") || lower.includes("node")) return "from-sky-500 to-indigo-600";
  if (lower.includes("security") || lower.includes("cyber")) return "from-red-500 to-rose-600";
  if (lower.includes("devops") || lower.includes("cloud") || lower.includes("aws") || lower.includes("docker") || lower.includes("kubernetes")) return "from-yellow-500 to-amber-600";
  return "from-violet-500 to-blue-600";
};

const navItems = [
  { label: "My Roadmaps", icon: <RoadmapIcon />, active: true },
  { label: "Settings", icon: <SettingsIcon />, active: false },
];

interface RoadmapRecord {
  id: string;
  topic: string;
  created_at: string;
  roadmap_content: string;
}

// ── Robust checkbox progress: accounts for ALL markdown variations (-, *, + and spacing) ──
const calculateProgress = (content: string): { completed: number; total: number; percentage: number } => {
  if (!content) return { completed: 0, total: 0, percentage: 0 };

  // Match all checkboxes (both empty and checked)
  const totalMatches = content.match(/^(\s*[-*+]\s+)\[\s?[xX ]?\s?\]/gm) || [];
  // Match ONLY checked boxes
  const completedMatches = content.match(/^(\s*[-*+]\s+)\[[xX]\]/gm) || [];

  const total = totalMatches.length;
  const completed = completedMatches.length;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  return { completed, total, percentage };
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [roadmaps, setRoadmaps] = useState<RoadmapRecord[]>([]);
  const [fetchingRoadmaps, setFetchingRoadmaps] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push("/");
        return;
      }
      setUser(session.user);
      setLoading(false);
    };
    getUser();
  }, [router]);

  useEffect(() => {
    if (!user) return;
    const fetchRoadmaps = async () => {
      const { data, error } = await supabase
        .from("roadmaps")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (!error && data) {
        setRoadmaps(data);
      }
      setFetchingRoadmaps(false);
    };
    fetchRoadmaps();
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Learner";

  return (
    <div className="min-h-screen bg-[#050508] text-white flex font-sans">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ===== SIDEBAR ===== */}
      <aside
        className={`
          fixed md:sticky top-0 left-0 z-50 h-screen w-64
          bg-[#0b0b12] border-r border-white/5
          flex flex-col
          transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        <div className="h-16 flex items-center gap-2.5 px-6 border-b border-white/5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center font-bold text-sm shadow-lg shadow-violet-900/40">
            S
          </div>
          <span className="font-semibold text-base tracking-tight">
            SIR <span className="text-violet-400">AI</span>
          </span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.label}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${
                  item.active
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
                }
              `}
            >
              <span className={item.active ? "text-violet-400" : "text-white/30"}>
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="px-3 pb-4 border-t border-white/5 pt-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400/60 hover:text-red-400 hover:bg-red-500/[0.06] transition-all"
          >
            <LogoutIcon />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden h-16 flex items-center justify-between px-4 border-b border-white/5 bg-[#0b0b12]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-all"
            aria-label="Open menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" x2="20" y1="12" y2="12" />
              <line x1="4" x2="20" y1="6" y2="6" />
              <line x1="4" x2="20" y1="18" y2="18" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center font-bold text-xs">S</div>
            <span className="font-semibold text-sm">SIR <span className="text-violet-400">AI</span></span>
          </div>
          <div className="w-8" />
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
            {/* ===== WELCOME HEADER ===== */}
            <div className="mb-10">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                Welcome back,{" "}
                <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-blue-400 bg-clip-text text-transparent">
                  {displayName}
                </span>
              </h1>
              <p className="mt-2 text-white/40 text-base sm:text-lg max-w-lg">
                Your library of {roadmaps.length} saved roadmap{roadmaps.length !== 1 ? "s" : ""}. Pick up where you left off.
              </p>
            </div>

            {fetchingRoadmaps ? (
              <div className="flex items-center justify-center py-24">
                <div className="w-7 h-7 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : roadmaps.length > 0 ? (
              /* ===== MY LIBRARY — PREMIUM COURSE CARD GRID ===== */
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-white/80">My Library</h2>
                  <button
                    onClick={() => router.push("/dashboard/generate")}
                    className="px-5 py-2.5 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 hover:opacity-90 text-white text-xs font-semibold transition-all shadow-[0_0_20px_rgba(139,92,246,0.2)]"
                  >
                    + New Roadmap
                  </button>
                </div>

                {/* Responsive Grid: 1 col mobile → 2 col tablet → 3 col desktop */}
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {roadmaps.map((rm) => {
                    const progress = calculateProgress(rm.roadmap_content);
                    const icon = getIconForTopic(rm.topic);
                    const gradient = getIconGradient(rm.topic);

                    return (
                      <button
                        key={rm.id}
                        onClick={() => router.push(`/dashboard/roadmap/${rm.id}`)}
                        className="group relative text-left p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04] transition-all duration-300"
                      >
                        {/* Subtle glow on hover */}
                        <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-violet-600/0 via-transparent to-blue-600/0 group-hover:from-violet-600/15 group-hover:to-blue-600/15 transition-all duration-500 opacity-0 group-hover:opacity-100 pointer-events-none" />

                        <div className="relative z-[1]">
                          {/* Row: Icon Badge + Title + Arrow */}
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3 min-w-0">
                              {/* Icon badge with gradient */}
                              <div className={`shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
                                {icon}
                              </div>
                              <h3 className="font-semibold text-base truncate group-hover:text-white transition-colors">
                                {rm.topic}
                              </h3>
                            </div>
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
                              className="shrink-0 text-white/20 group-hover:text-violet-400 transition-colors mt-1"
                            >
                              <path d="M5 12h14" />
                              <path d="m12 5 7 7-7 7" />
                            </svg>
                          </div>

                          {/* Date */}
                          <div className="flex items-center gap-1.5 mb-3 text-xs text-white/30">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                              <line x1="16" x2="16" y1="2" y2="6" />
                              <line x1="8" x2="8" y1="2" y2="6" />
                              <line x1="3" x2="21" y1="10" y2="10" />
                            </svg>
                            {formatDate(rm.created_at)}
                          </div>

                          {/* Progress bar */}
                          {progress.total > 0 && (
                            <div>
                              <div className="flex justify-between items-center mb-1.5">
                                <span className="text-xs text-white/40">{progress.completed}/{progress.total} tasks</span>
                                <span className="text-xs font-semibold text-violet-400">{progress.percentage}%</span>
                              </div>
                              <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-violet-500 to-blue-500 rounded-full transition-all duration-700"
                                  style={{ width: `${progress.percentage}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* If no checkboxes yet, show subtle hint */}
                          {progress.total === 0 && (
                            <p className="text-xs text-white/20 italic">No tasks tracked yet</p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* ===== EMPTY STATE ===== */
              <div className="relative group">
                <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-br from-violet-600/40 via-fuchsia-600/20 to-blue-600/40 opacity-60 group-hover:opacity-100 transition-opacity blur-[1px]" />
                <div className="relative rounded-3xl bg-[#0b0b14] border border-white/[0.06] overflow-hidden">
                  <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full bg-violet-700/10 blur-[100px] pointer-events-none" />
                  <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full bg-blue-700/10 blur-[80px] pointer-events-none" />
                  <div className="relative px-6 sm:px-10 lg:px-14 py-14 sm:py-16 lg:py-20 flex flex-col items-center text-center">
                    <div className="mb-6 p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20">
                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-400">
                        <path d="M12 3a6 6 0 0 0 9 9 6 6 0 0 0-9-9" />
                        <path d="M20 7v6" />
                        <path d="M14 10h4" />
                        <path d="M5 12a6 6 0 0 0 6-6" opacity="0.3" />
                      </svg>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold mb-3">
                      Generate your first{" "}
                      <span className="bg-gradient-to-r from-violet-300 to-blue-300 bg-clip-text text-transparent">
                        mastery roadmap
                      </span>
                    </h2>
                    <p className="max-w-md text-white/40 text-sm sm:text-base leading-relaxed mb-8">
                      Tell SIR AI what you want to learn, and we'll build a
                      personalized, phase-by-phase roadmap — from fundamentals to
                      proof-of-work projects.
                    </p>
                    <button
                      onClick={() => router.push("/dashboard/generate")}
                      className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-600 to-blue-600 hover:opacity-90 text-white font-semibold text-sm shadow-[0_0_25px_rgba(139,92,246,0.3)] hover:shadow-[0_0_35px_rgba(139,92,246,0.4)] transition-all"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>
                      Start Building Your Roadmap
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Info grid — only when empty */}
            {roadmaps.length === 0 && !fetchingRoadmaps && (
              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.02]">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-3 text-violet-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                  </div>
                  <h4 className="font-medium text-sm mb-1">AI-Powered</h4>
                  <p className="text-xs text-white/35 leading-relaxed">Roadmaps tailored by Llama 3 on Groq for your exact skill level.</p>
                </div>
                <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.02]">
                  <div className="w-8 h-8 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center mb-3 text-fuchsia-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M3 9h18" /><path d="M9 21V9" /></svg>
                  </div>
                  <h4 className="font-medium text-sm mb-1">Phase-by-Phase</h4>
                  <p className="text-xs text-white/35 leading-relaxed">Structured phases from fundamentals to proof-of-work projects.</p>
                </div>
                <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.02]">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-3 text-blue-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                  </div>
                  <h4 className="font-medium text-sm mb-1">Actionable</h4>
                  <p className="text-xs text-white/35 leading-relaxed">Every phase has clear tasks, resources, and measurable outcomes.</p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}