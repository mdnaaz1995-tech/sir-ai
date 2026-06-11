"use client";

import { useState } from "react";
import { HeroSearch } from "./HeroSearch";
import { LoadingState } from "./LoadingState";
import { RoadmapDisplay } from "./RoadmapDisplay";

const API_URL = "https://sir-ai-backend.onrender.com";

export function SirAiLanding() {
  const [skill, setSkill] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [roadmap, setRoadmap] = useState<string | null>(null);
  const [activeSkill, setActiveSkill] = useState("");
  const [error, setError] = useState<string | null>(null);

  const generateRoadmap = async () => {
    const trimmed = skill.trim();
    if (!trimmed || isLoading) return;

    setIsLoading(true);
    setError(null);
    setRoadmap(null);

    try {
      const res = await fetch(`${API_URL}/generate_roadmap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skill: trimmed }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          (err as { detail?: string }).detail ?? `Request failed (${res.status})`
        );
      }

      const data = (await res.json()) as {
        roadmap: string;
        skill: string;
      };
      setActiveSkill(data.skill ?? trimmed);
      setRoadmap(data.roadmap);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not reach SIR AI. Is the backend running on port 8000?"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050508]">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,80,255,0.25),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed top-1/4 -left-32 w-96 h-96 rounded-full bg-violet-700/20 blur-[120px]"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed bottom-0 right-0 w-[500px] h-[400px] rounded-full bg-blue-700/15 blur-[100px]"
        aria-hidden
      />

      <header className="relative z-10 border-b border-white/5 bg-black/20 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center font-bold text-sm shadow-lg shadow-violet-900/40">
              S
            </div>
            <span className="font-semibold text-lg tracking-tight">
              SIR <span className="text-violet-400">AI</span>
            </span>
          </div>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-white/50">
            <span className="hover:text-white/80 transition-colors cursor-default">
              Roadmaps
            </span>
            <span className="hover:text-white/80 transition-colors cursor-default">
              Mentorship
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/70">
              Premium
            </span>
          </nav>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 pt-16 md:pt-24 pb-8">
        <div className="text-center mb-10 md:mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-xs font-medium text-violet-300 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            Powered by Groq · Llama 3
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-5">
            <span className="bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent">
              Master any skill.
            </span>
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-blue-400 bg-clip-text text-transparent">
              One roadmap at a time.
            </span>
          </h1>
          <p className="max-w-xl mx-auto text-base md:text-lg text-white/50 leading-relaxed">
            SIR AI builds personalized, phase-by-phase mastery roadmaps — from
            vision to proof-of-work projects — in seconds.
          </p>
        </div>

        <HeroSearch
          skill={skill}
          onSkillChange={setSkill}
          onSubmit={generateRoadmap}
          isLoading={isLoading}
        />

        {error && (
          <div
            role="alert"
            className="max-w-3xl mx-auto mt-6 px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-200 text-sm text-center"
          >
            {error}
          </div>
        )}

        {isLoading && <LoadingState skill={skill.trim()} />}

        {roadmap && !isLoading && (
          <RoadmapDisplay skill={activeSkill} markdown={roadmap} />
        )}
      </main>

      <footer className="relative z-10 border-t border-white/5 py-8 text-center text-sm text-white/30">
        © {new Date().getFullYear()} SIR AI · Premium AI Learning Platform
      </footer>
    </div>
  );
}
