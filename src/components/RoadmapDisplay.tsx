"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  parseRoadmapSections,
  extractPhases,
  type RoadmapSection,
  type SectionKind,
} from "@/lib/parseRoadmap";

interface RoadmapDisplayProps {
  skill: string;
  markdown: string;
}

const SECTION_META: Record<
  SectionKind,
  { icon: string; gradient: string; label: string }
> = {
  vision: {
    icon: "🎯",
    gradient: "from-violet-600/20 to-purple-900/10",
    label: "Vision",
  },
  prerequisites: {
    icon: "🛠️",
    gradient: "from-blue-600/20 to-indigo-900/10",
    label: "Prerequisites",
  },
  phases: {
    icon: "🗺️",
    gradient: "from-fuchsia-600/20 to-violet-900/10",
    label: "Mastery Path",
  },
  accelerators: {
    icon: "⚡",
    gradient: "from-amber-500/15 to-orange-900/10",
    label: "Pro Tips",
  },
  toolkit: {
    icon: "🧰",
    gradient: "from-emerald-600/15 to-teal-900/10",
    label: "Toolkit",
  },
  other: {
    icon: "✨",
    gradient: "from-white/10 to-white/5",
    label: "Roadmap",
  },
};

function MarkdownBlock({ content }: { content: string }) {
  return (
    <div className="prose-roadmap text-sm md:text-base">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

function SectionCard({ section }: { section: RoadmapSection }) {
  const meta = SECTION_META[section.kind];

  if (section.kind === "phases") {
    const phases = extractPhases(section.content);
    if (phases.length > 0) {
      return (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div
            className={`px-6 py-4 border-b border-white/8 bg-gradient-to-r ${meta.gradient}`}
          >
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <span>{meta.icon}</span>
              {section.title}
            </h3>
          </div>
          <div className="p-6 md:p-8">
            <div className="relative">
              <div
                className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-violet-500/60 via-blue-500/40 to-transparent"
                aria-hidden
              />
              <ol className="space-y-8">
                {phases.map((phase, i) => (
                  <li key={i} className="relative pl-10">
                    <span
                      className="absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-blue-600 text-xs font-bold text-white shadow-lg shadow-violet-900/50"
                      aria-hidden
                    >
                      {i + 1}
                    </span>
                    <h4 className="text-base font-semibold text-white/95 mb-3">
                      {phase.title}
                    </h4>
                    <div className="glass-card rounded-xl p-4 md:p-5 border-white/6">
                      <MarkdownBlock content={phase.body} />
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="glass-card rounded-2xl overflow-hidden h-full">
      <div
        className={`px-6 py-4 border-b border-white/8 bg-gradient-to-r ${meta.gradient}`}
      >
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <span>{meta.icon}</span>
          {section.title}
        </h3>
      </div>
      <div className="p-6 md:p-7">
        <MarkdownBlock content={section.content} />
      </div>
    </div>
  );
}

export function RoadmapDisplay({ skill, markdown }: RoadmapDisplayProps) {
  const [copied, setCopied] = useState(false);
  const sections = parseRoadmapSections(markdown);

  const vision = sections.filter((s) => s.kind === "vision");
  const prerequisites = sections.filter((s) => s.kind === "prerequisites");
  const phases = sections.filter((s) => s.kind === "phases");
  const tips = sections.filter(
    (s) => s.kind === "accelerators" || s.kind === "toolkit"
  );
  const other = sections.filter((s) => s.kind === "other");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  const gridSections = [
    ...vision,
    ...prerequisites,
    ...phases,
    ...tips,
    ...other,
  ];

  return (
    <div className="w-full max-w-5xl mx-auto mt-14 md:mt-16 px-4 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <p className="text-sm font-medium text-violet-400/90 uppercase tracking-widest mb-1">
            Your Mastery Roadmap
          </p>
          <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
            {skill}
          </h2>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl glass-card text-sm font-medium text-white/80 hover:text-white hover:border-violet-500/30 transition-all"
        >
          {copied ? (
            <>
              <svg
                className="w-4 h-4 text-emerald-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Copy to Clipboard
            </>
          )}
        </button>
      </div>

      <div className="grid gap-6 md:gap-8">
        {(vision.length > 0 || prerequisites.length > 0) && (
          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            {vision.map((s, i) => (
              <SectionCard key={`vision-${i}`} section={s} />
            ))}
            {prerequisites.map((s, i) => (
              <SectionCard key={`pre-${i}`} section={s} />
            ))}
          </div>
        )}

        {phases.map((s, i) => (
          <SectionCard key={`phase-${i}`} section={s} />
        ))}

        {tips.length > 0 && (
          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            {tips.map((s, i) => (
              <SectionCard key={`tip-${i}`} section={s} />
            ))}
          </div>
        )}

        {gridSections.length === 0 && (
          <div className="glass-card rounded-2xl p-6 md:p-8">
            <MarkdownBlock content={markdown} />
          </div>
        )}

        {other.map((s, i) => (
          <SectionCard key={`other-${i}`} section={s} />
        ))}
      </div>
    </div>
  );
}
