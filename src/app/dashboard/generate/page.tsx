"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const GenerateIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3a6 6 0 0 0 9 9 6 6 0 0 0-9-9" />
    <path d="M20 7v6" />
    <path d="M14 10h4" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

export default function GeneratePage() {
  const router = useRouter();
  const [skill, setSkill] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push("/");
    });
  }, [router]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = skill.trim();
    if (!trimmed || generating) return;

    setGenerating(true);

    // TODO: Connect to Groq AI API in a future step
    // For now, simulate a brief delay
    await new Promise((r) => setTimeout(r, 800));

    setGenerating(false);
    // TODO: Navigate to results page or display roadmap inline
  };

  return (
    <div className="min-h-screen bg-[#050508] text-white flex font-sans">
      {/* ===== SIDEBAR (same as dashboard) ===== */}
      <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 bg-[#0b0b12] border-r border-white/5">
        <div className="h-16 flex items-center gap-2.5 px-6 border-b border-white/5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center font-bold text-sm shadow-lg shadow-violet-900/40">
            S
          </div>
          <span className="font-semibold text-base tracking-tight">
            SIR <span className="text-violet-400">AI</span>
          </span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18h18" />
              <path d="m19 9-5 5-4-4-3 3" />
            </svg>
            My Roadmaps
          </button>

          <button
            onClick={() => router.push("/dashboard/generate")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium bg-white/10 text-white shadow-sm transition-all"
          >
            <span className="text-violet-400">
              <GenerateIcon />
            </span>
            Generate New
          </button>

          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            Settings
          </button>
        </nav>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="md:hidden h-16 flex items-center justify-between px-4 border-b border-white/5 bg-[#0b0b12]">
          <button
            onClick={() => router.push("/dashboard")}
            className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-all"
            aria-label="Back"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <span className="font-semibold text-sm">
            SIR <span className="text-violet-400">AI</span>
          </span>
          <div className="w-8" />
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl mx-auto">
            {/* Decorative glow */}
            <div className="relative">
              <div className="absolute -top-40 -left-20 w-80 h-80 rounded-full bg-violet-700/10 blur-[120px] pointer-events-none" />
              <div className="absolute -bottom-20 -right-20 w-60 h-60 rounded-full bg-blue-700/10 blur-[100px] pointer-events-none" />

              <div className="relative text-center mb-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-xs font-medium text-violet-300 mb-5">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                  Powered by Groq · Llama 3
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
                  What do you want to{" "}
                  <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-blue-400 bg-clip-text text-transparent">
                    master
                  </span>
                  ?
                </h1>
                <p className="text-white/40 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
                  Tell SIR AI a skill, topic, or discipline. We'll generate a
                  structured, phase-by-phase mastery roadmap powered by AI.
                </p>
              </div>

              {/* Input form */}
              <form onSubmit={handleGenerate} className="relative">
                <div className="relative group">
                  <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-violet-600/40 via-fuchsia-600/20 to-blue-600/40 opacity-60 group-focus-within:opacity-100 transition-opacity blur-[1px]" />
                  <div className="relative flex items-center bg-[#0b0b14] border border-white/[0.06] rounded-2xl overflow-hidden focus-within:border-white/10 transition-all">
                    <div className="pl-5 pr-3 text-violet-400/60 group-focus-within:text-violet-400 transition-colors">
                      <GenerateIcon />
                    </div>
                    <input
                      type="text"
                      value={skill}
                      onChange={(e) => setSkill(e.target.value)}
                      placeholder="e.g., Full-Stack Blockchain, Rust, AI Engineering..."
                      className="flex-1 bg-transparent py-5 pr-4 text-white placeholder:text-white/20 text-base sm:text-lg outline-none"
                      disabled={generating}
                      autoFocus
                    />
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <button
                    type="submit"
                    disabled={!skill.trim() || generating}
                    className="inline-flex items-center gap-2.5 px-10 py-4 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-600 to-blue-600 hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold text-sm shadow-[0_0_25px_rgba(139,92,246,0.3)] hover:shadow-[0_0_35px_rgba(139,92,246,0.4)] transition-all"
                  >
                    {generating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <ArrowRightIcon />
                        Generate AI Roadmap
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Example prompts */}
              <div className="mt-10 text-center">
                <p className="text-xs text-white/20 uppercase tracking-widest mb-3">Try something popular</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {["Full-Stack Blockchain", "Machine Learning", "Cloud Architecture", "iOS Development"].map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => setSkill(prompt)}
                      className="px-3.5 py-1.5 rounded-lg border border-white/5 bg-white/[0.02] text-xs text-white/30 hover:text-white/60 hover:border-white/10 transition-all"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}