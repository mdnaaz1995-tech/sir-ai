"use client";

import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";

interface RoadmapDisplayProps {
  skill: string;
  markdown: string;
}

export function RoadmapDisplay({ skill, markdown }: RoadmapDisplayProps) {
  const [content, setContent] = useState(markdown);
  const contentRef = useRef(content);

  useEffect(() => {
    setContent(markdown);
    contentRef.current = markdown;
  }, [markdown]);

  const calcStats = (text: string) => {
    const tasks = text.match(/^\s*[-*+]\s+\[([ xX])]/gm) || [];
    const total = tasks.length;
    const done = tasks.filter((t) => t.includes("x") || t.includes("X")).length;
    return { total, done, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
  };

  const stats = calcStats(content);

  // ── AST position-based toggle: mutate EXACT array index from node.position.start.line ──
  const toggleLine = (lineIndex: number, isCurrentlyChecked: boolean) => {
    const lines = contentRef.current.split("\n");

    // Guard: verify lineIndex is valid and line is a checkbox line
    if (lineIndex < 0 || lineIndex >= lines.length) return;
    if (!/^\s*[-*+]\s+\[[ xX]\]/.test(lines[lineIndex])) return;

    if (isCurrentlyChecked) {
      // User wants to UNCHECK it
      lines[lineIndex] = lines[lineIndex].replace(/^(\s*[-*+]\s+)\[[xX]\]/i, '$1[ ]');
    } else {
      // User wants to CHECK it
      lines[lineIndex] = lines[lineIndex].replace(/^(\s*[-*+]\s+)\[\s?\]/, '$1[x]');
    }

    const updated = lines.join("\n");
    contentRef.current = updated;
    setContent(updated);

    try {
      localStorage.setItem(`roadmap-progress-${skill}`, JSON.stringify({ content: updated }));
    } catch (e) { /* silent */ }
  };

  return (
    <div className="max-w-4xl mx-auto mt-12 p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between items-end mb-2">
          <h3 className="text-violet-400 font-bold text-sm tracking-widest uppercase">{stats.done} / {stats.total} Tasks</h3>
          <span className="text-2xl font-black text-white">{stats.pct}%</span>
        </div>
        <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${stats.pct}%` }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            className="h-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-blue-500 rounded-full shadow-[0_0_15px_rgba(139,92,246,0.5)]"
          />
        </div>
      </div>

      <AnimatePresence>
        {stats.pct === 100 && stats.total > 0 && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="mb-8 p-4 rounded-2xl bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/50 text-center"
          >
            <span className="text-2xl">🏆</span>
            <h4 className="text-yellow-400 font-bold text-lg">MASTERY ACHIEVED!</h4>
            <p className="text-yellow-200/70 text-sm">You have conquered the {skill} roadmap!</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="prose prose-invert max-w-none">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">{skill} Mastery Roadmap</h2>
          <button
            onClick={() => { navigator.clipboard.writeText(content); alert("Roadmap copied to clipboard!"); }}
            className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-xs text-white/70 transition-all"
          >
            Copy to Clipboard
          </button>
        </div>

        <div className="relative text-white/80" style={{ color: "#f8fafc" }}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }: any) => {
                const t = String(children).trim();
                if (t.includes("PROOF OF WORK") || t.includes("Core Topics")) {
                  return <div className="p-4 mb-4 rounded-xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 text-yellow-200">🏆 <strong>{children}</strong></div>;
                }
                return <p className="mb-4 leading-relaxed text-white/70">{children}</p>;
              },
              ul: ({ children }: any) => <ul className="space-y-2 mb-4">{children}</ul>,

              // ── AST Source Position Architecture ──
              // Each li extracts its exact source line number from node.position.start.line
              // and passes ONLY the index + checked state to the toggle — NO text matching.
              li: ({ children, node, ...props }: any) => {
                const arr = React.Children.toArray(children);
                const first = arr[0] as any;
                const hasCheckbox = first?.type === "input";
                if (hasCheckbox) {
                  const checked = first?.props?.checked ?? false;
                  // Convert 1-based AST line → 0-based array index
                  const lineIndex = node.position.start.line - 1;

                  return (
                    <li
                      className={`p-3 mb-2 rounded-xl border transition-all duration-300 flex items-start gap-3 list-none ${
                        checked ? "bg-green-500/10 border-green-500/50 text-green-200" : "bg-white/5 border-white/10 text-white/80"
                      }`}
                      style={{ marginLeft: 0 }}
                    >
                      <div
                        onClick={(e) => { e.stopPropagation(); e.preventDefault(); toggleLine(lineIndex, checked); }}
                        className={`w-4 h-4 rounded-full border transition-colors flex items-center justify-center shrink-0 cursor-pointer hover:scale-110 active:scale-95 mt-0.5 ${
                          checked ? "bg-green-500 border-green-500" : "border-white/30 hover:border-violet-400"
                        }`}
                      >
                        {checked && (
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      <span className={checked ? "line-through opacity-60" : ""}>{arr.slice(1)}</span>
                    </li>
                  );
                }
                return <li className="flex items-start gap-2 text-white/70"><span className="text-violet-400 mt-0.5 shrink-0">•</span><span>{children}</span></li>;
              },
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}