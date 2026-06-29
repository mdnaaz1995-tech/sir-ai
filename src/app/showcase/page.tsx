"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

// ── Types ──
interface ShowcaseProject {
  id: string;
  project_title: string;
  project_url?: string; // optional for backward compatibility
  user_name: string;
  submission_type?: string; // e.g., "url", "image", "audio"
  submission_data?: any; // JSON payload for multimodal content
}

// ── SVG Icons ──
const RocketIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
    <path d="M12 15l-3-3c-1.66-2.23-3-5.39-3-8 4.08 0 7.14 1.34 9 3l3 3" />
    <path d="M16.5 11.5c.63.84 1.49 1.92 1.49 3.5 0 1.1-.4 2.1-1 3" />
    <path d="M19 15c.55.88 1 2 1 3 0 1.1-.45 2.1-1 3" />
    <path d="M21 18c.33.66.5 1.5.5 2.5 0 .9-.2 1.7-.5 2.5" />
    <path d="M12 12l3 3" />
  </svg>
);

const TrophyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 7 7 7 7" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 17 7 17 7" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

// ── Helper: extract domain from URL ──
const getDomain = (url: string) => {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
};

export default function ShowcasePage() {
  const [projects, setProjects] = useState<ShowcaseProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from("project_progress")
          .select("id, user_name, project_title, project_url, submission_type, submission_data")
          // For legacy records without a URL, allow nulls; new types may not have a URL
          .or("submission_type.eq.url,submission_type.is.null")
          .order("id", { ascending: false })
          .limit(50);

        if (fetchError) {
          console.error("[showcase] Supabase fetch error:", fetchError);
          throw fetchError;
        }

        if (!data || data.length === 0) {
          setProjects([]);
          setLoading(false);
          return;
        }

        setProjects(data as ShowcaseProject[]);
      } catch (err: any) {
        console.error("[showcase] Failed to fetch projects:", err);
        setError(err.message || "Failed to load projects");
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // ── Render ──
  return (
    <div className="min-h-screen bg-brand-bg text-white">
      {/* ── Ambient background effects ── */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,80,255,0.25),transparent)]" aria-hidden />
      <div className="pointer-events-none fixed top-1/3 -left-40 w-96 h-96 rounded-full bg-violet-700/15 blur-[120px]" aria-hidden />
      <div className="pointer-events-none fixed bottom-0 right-0 w-[500px] h-[400px] rounded-full bg-blue-700/10 blur-[100px]" aria-hidden />

      {/* ── Simple Nav Bar ── */}
      <header className="relative z-10 border-b border-white/5 bg-black/20 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center font-bold text-sm shadow-lg shadow-violet-900/40">
              S
            </div>
            <span className="font-semibold text-lg tracking-tight">
              SIR <span className="text-violet-400">AI</span>
            </span>
          </Link>

          <nav className="flex items-center gap-6 text-sm">
            <Link href="/" className="text-white/40 hover:text-white/80 transition-colors">
              Home
            </Link>
            <span className="text-violet-300 font-medium border-b-2 border-violet-500 pb-0.5">
              Wall of Fame
            </span>
          </nav>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 py-12 md:py-16">
        {/* ── Page Header ── */}
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-xs font-medium text-amber-300 mb-5">
            <TrophyIcon />
            Proof of Work Showcase
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-4 font-heading">
            <span className="bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent">
              Wall of{" "}
            </span>
            <span className="bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent">
              Fame
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-base md:text-lg text-white/50 leading-relaxed">
            Real projects built by real learners. Every link here is a "Proof of Work" —
            submitted by SIR AI users who completed their milestones.
          </p>
        </div>

        {/* ── Loading State ── */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-white/40">Loading showcase projects...</p>
          </div>
        )}

        {/* ── Error State ── */}
        {error && !loading && (
          <div className="max-w-2xl mx-auto px-6 py-10 rounded-2xl border border-red-500/30 bg-red-500/10 text-center">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        {/* ── Empty State ── */}
        {!loading && !error && projects.length === 0 && (
          <div className="relative group max-w-lg mx-auto">
            <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-br from-violet-600/30 via-fuchsia-600/15 to-blue-600/30 opacity-60 group-hover:opacity-100 transition-opacity blur-[1px]" />
            <div className="relative rounded-3xl bg-brand-card border border-white/[0.06] overflow-hidden">
              <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full bg-violet-700/10 blur-[100px] pointer-events-none" />
              <div className="relative px-8 sm:px-12 py-16 sm:py-20 flex flex-col items-center text-center">
                <div className="mb-6 p-5 rounded-2xl bg-violet-500/10 border border-violet-500/20">
                  <RocketIcon className="text-violet-400 w-12 h-12" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-3 font-heading">
                  Abhi list <span className="text-amber-400">khali</span> hai
                </h2>
                <p className="max-w-md text-white/40 text-sm sm:text-base leading-relaxed mb-2">
                  Be the first to build and feature your project here!
                </p>
                <p className="text-white/30 text-xs">
                  Complete a milestone in your roadmap and submit your live project URL to appear here.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Project Grid ── */}
        {!loading && projects.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <div
                key={project.id}
                className="group relative p-5 rounded-2xl border border-white/[0.06] bg-brand-card hover:border-white/[0.12] transition-all duration-300"
              >
                {/* Subtle glow on hover */}
                <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-amber-600/0 via-transparent to-violet-600/0 group-hover:from-amber-600/15 group-hover:to-violet-600/15 transition-all duration-500 opacity-0 group-hover:opacity-100 pointer-events-none" />

                <div className="relative z-[1] flex flex-col h-full">
                  {/* Media rendering based on submission_type */}
                    {project.submission_type === "image" ? (
                      (() => {
                        try {
                          const url = project.submission_data?.file_url || "";
                          return url ? (
                            <img
                              src={url}
                              alt={project.project_title}
                              className="mb-4 w-full h-48 object-cover rounded-md border border-slate-700"
                            />
                          ) : (
                            <div className="mb-4 w-full h-36 rounded-xl bg-gray-800 flex items-center justify-center">
                              <span className="text-sm text-white/50">Image data missing</span>
                            </div>
                          );
                        } catch {
                          return (
                            <div className="mb-4 w-full h-36 rounded-xl bg-gray-800 flex items-center justify-center">
                              <span className="text-sm text-white/50">Invalid image data</span>
                            </div>
                          );
                        }
                      })()
                    ) : project.submission_type === "audio" ? (
                      (() => {
                        try {
                          const audioUrl = project.submission_data?.audio_url || "";
                          return audioUrl ? (
                            <audio controls className="w-full mt-2" src={audioUrl} />
                          ) : (
                            <div className="mb-4 w-full h-36 rounded-xl bg-gray-800 flex items-center justify-center">
                              <span className="text-sm text-white/50">Audio data missing</span>
                            </div>
                          );
                        } catch {
                          return (
                            <div className="mb-4 w-full h-36 rounded-xl bg-gray-800 flex items-center justify-center">
                              <span className="text-sm text-white/50">Invalid audio data</span>
                            </div>
                          );
                        }
                      })()
                    ) : (
                      <div className="mb-4 w-full h-36 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/[0.06] flex items-center justify-center overflow-hidden">
                        <div className="text-center">
                          <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-amber-500/20 to-violet-500/20 border border-white/10 flex items-center justify-center mb-2">
                            <span className="text-lg font-bold text-white/50">
                              {project.project_url ? getDomain(project.project_url).charAt(0).toUpperCase() : "🌐"}
                            </span>
                          </div>
                          <p className="text-[10px] text-white/30 font-mono truncate max-w-[180px] px-2">
                            {project.project_url ? getDomain(project.project_url) : ""}
                          </p>
                        </div>
                      </div>
                    )}

                  {/* Project Title */}
                  <h3 className="font-semibold text-base leading-snug mb-3 line-clamp-2">
                    {project.project_title}
                  </h3>

                  {/* Built by */}
                  <div className="flex items-center gap-1.5 text-xs text-white/40 mb-4">
                    <UserIcon />
                    <span>Built by <strong className="text-white/60 font-medium">{project.user_name}</strong></span>
                  </div>

                  {/* Spacer */}
                  <div className="flex-1" />

                  {/* Visit Live Project button */}
                    {project.submission_type === "url" || project.submission_type === undefined ? (
                      <a
                        href={project.project_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-brand-primary hover:opacity-90 text-white text-sm font-semibold transition-all active:scale-[0.98]"
                      >
                        <ExternalLinkIcon />
                        Visit Live Project
                      </a>
                    ) : null}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Footer note ── */}
        {!loading && projects.length > 0 && (
          <p className="text-center text-xs text-white/20 mt-10">
            Showing {projects.length} project{projects.length !== 1 ? "s" : ""} · Updated as learners complete milestones
          </p>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/5 py-8 text-center text-sm text-white/30">
        <div className="max-w-6xl mx-auto px-4">
          © {new Date().getFullYear()} SIR AI · Premium AI Learning Platform
        </div>
      </footer>
    </div>
  );
}
