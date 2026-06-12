"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ReactMarkdown from "react-markdown";

export default function RoadmapDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [roadmap, setRoadmap] = useState<{ topic: string; content: string; created_at: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoadmap = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/");
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("roadmaps")
        .select("topic, content, created_at")
        .eq("id", params.id)
        .single();

      if (fetchError || !data) {
        setError("Roadmap not found");
      } else {
        setRoadmap(data);
      }
      setLoading(false);
    };

    fetchRoadmap();
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="min-h-screen bg-[#050508] text-white">
      {/* Top bar */}
      <header className="border-b border-white/5 bg-black/20 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-sm text-white/40 hover:text-white transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back to Dashboard
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center font-bold text-xs">S</div>
            <span className="font-semibold text-sm">SIR <span className="text-violet-400">AI</span></span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-blue-400 bg-clip-text text-transparent">
              {roadmap.topic}
            </span>
          </h1>
          <p className="text-white/30 text-sm mt-1">Generated on {formatDate(roadmap.created_at)}</p>
        </div>

        {/* Progress decoration */}
        <div className="mb-8 h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
          <div className="h-full w-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-blue-500 rounded-full" style={{ width: "100%" }} />
        </div>

        {/* Roadmap content */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl">
          <div className="prose prose-invert max-w-none">
            <div className="relative text-white/80">
              <ReactMarkdown
                components={{
                  h2: ({ children }: any) => (
                    <h2 className="text-xl sm:text-2xl font-bold mt-8 mb-4 text-white flex items-center gap-2">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }: any) => (
                    <h3 className="text-lg font-semibold mt-6 mb-2 text-white/90">{children}</h3>
                  ),
                  p: ({ children }: any) => {
                    const text = String(children).trim();
                    if (text.includes("🏆 PROOF OF WORK") || text.includes("PROOF OF WORK")) {
                      return (
                        <div className="p-4 mb-4 rounded-xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 text-yellow-200">
                          🏆 <strong>{children}</strong>
                        </div>
                      );
                    }
                    return <p className="mb-3 leading-relaxed text-white/70">{children}</p>;
                  },
                  ul: ({ children }: any) => <ul className="space-y-2 mb-4">{children}</ul>,
                  li: ({ children }: any) => (
                    <li className="flex items-start gap-2 text-white/70">
                      <span className="text-violet-400 mt-0.5 shrink-0">•</span>
                      <span>{children}</span>
                    </li>
                  ),
                  strong: ({ children }: any) => (
                    <strong className="text-white font-semibold">{children}</strong>
                  ),
                }}
              >
                {roadmap.content}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}