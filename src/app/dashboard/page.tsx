"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

// --- SVG Icons ---

const RoadmapIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18" />
    <path d="m19 9-5 5-4-4-3 3" />
  </svg>
);

const MentorshipIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
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

const SparkleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-400">
    <path d="M12 3a6 6 0 0 0 9 9 6 6 0 0 0-9-9" />
    <path d="M20 7v6" />
    <path d="M14 10h4" />
    <path d="M5 12a6 6 0 0 0 6-6" opacity="0.3" />
  </svg>
);

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" x2="16" y1="2" y2="6" />
    <line x1="8" x2="8" y1="2" y2="6" />
    <line x1="3" x2="21" y1="10" y2="10" />
  </svg>
);

const ArrowRightSmall = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

interface RoadmapRecord {
  id: string;
  topic: string;
  created_at: string;
  content: string;
}

// --- Sidebar Nav Items ---

const navItems = [
  { label: "My Roadmaps", icon: <RoadmapIcon />, active: true },
  { label: "Mentorship", icon: <MentorshipIcon />, active: false },
  { label: "Settings", icon: <SettingsIcon />, active: false },
];

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

  // Fetch saved roadmaps once we have the user
  useEffect(() => {
    if (!user) return;

    const fetchRoadmaps = async () => {
      const { data, error } = await supabase
        .from("roadmaps")
        .select("id, topic, created_at, content")
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

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
            {/* ===== WELCOME HEADER ===== */}
            <div className="mb-10">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                Welcome back,{" "}
                <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-blue-400 bg-clip-text text-transparent">
                  {displayName}
                </span>
              </h1>
              <p className="mt-2 text-white/40 text-base sm:text-lg max-w-lg">
                You have {roadmaps.length} saved roadmap{roadmaps.length !== 1 ? "s" : ""}. Continue your learning journey.
              </p>
            </div>

            {fetchingRoadmaps ? (
              /* Loading state */
              <div className="flex items-center justify-center py-20">
                <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : roadmaps.length > 0 ? (
              /* ===== ROADMAP LIST ===== */
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-semibold text-white/80">My Roadmaps</h2>
                  <button
                    onClick={() => router.push("/dashboard/generate")}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 hover:opacity-90 text-white text-xs font-semibold transition-all"
                  >
                    + New Roadmap
                  </button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {roadmaps.map((rm) => (
                    <button
                      key={rm.id}
                      onClick={() => router.push(`/dashboard/roadmap/${rm.id}`)}
                      className="group relative text-left p-5 rounded-2xl border border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04] transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-base group-hover:text-violet-400 transition-colors">
                          {rm.topic}
                        </h3>
                        <ArrowRightSmall />
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-white/30">
                        <CalendarIcon />
                        {formatDate(rm.created_at)}
                      </div>
                      {/* Preview snippet */}
                      <p className="mt-3 text-xs text-white/30 line-clamp-2 leading-relaxed">
                        {rm.content.replace(/[#*`]/g, "").slice(0, 150)}...
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* ===== EMPTY STATE (no roadmaps yet) ===== */
              <div className="relative group">
                <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-br from-violet-600/40 via-fuchsia-600/20 to-blue-600/40 opacity-60 group-hover:opacity-100 transition-opacity blur-[1px]" />
                <div className="relative rounded-3xl bg-[#0b0b14] border border-white/[0.06] overflow-hidden">
                  <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full bg-violet-700/10 blur-[100px] pointer-events-none" />
                  <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full bg-blue-700/10 blur-[80px] pointer-events-none" />
                  <div className="relative px-6 sm:px-10 lg:px-14 py-14 sm:py-16 lg:py-20 flex flex-col items-center text-center">
                    <div className="mb-6 p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20">
                      <SparkleIcon />
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

            {/* Info grid — only show when no roadmaps */}
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