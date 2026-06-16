"use client";

import { useState } from "react";

interface ProfilingModalProps {
  isOpen: boolean;
  onClose: () => void;
  topic: string;
  onGenerate: (level: string, goal: string) => void;
  isLoading: boolean;
}

const LEVELS = ["Beginner", "Intermediate", "Advanced"];
const GOALS = ["Get a Job", "Freelancing", "Side Project"];

export function ProfilingModal({
  isOpen,
  onClose,
  topic,
  onGenerate,
  isLoading,
}: ProfilingModalProps) {
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = () => {
    if (!selectedLevel || !selectedGoal || isLoading) return;
    onGenerate(selectedLevel, selectedGoal);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={!isLoading ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c12] shadow-2xl shadow-violet-950/60">
          {/* Glow effect */}
          <div
            className="pointer-events-none absolute -top-24 -right-24 w-48 h-48 rounded-full bg-violet-700/20 blur-[80px]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-blue-700/15 blur-[80px]"
            aria-hidden
          />

          <div className="relative p-6 md:p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                Fine-Tune Your Roadmap
              </h2>
              {!isLoading && (
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/5 transition-colors"
                  aria-label="Close modal"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* Topic display */}
            <p className="text-sm text-white/50 mb-6">
              Generating roadmap for:{" "}
              <span className="text-violet-300 font-medium">{topic}</span>
            </p>

            {/* Level */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-white/70 mb-3">
                Level
              </label>
              <div className="flex flex-wrap gap-2">
                {LEVELS.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => !isLoading && setSelectedLevel(level)}
                    disabled={isLoading}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${
                      selectedLevel === level
                        ? "border-violet-500 bg-violet-500/20 text-violet-200 shadow-[0_0_12px_rgba(139,92,246,0.15)]"
                        : "border-white/10 bg-white/5 text-white/55 hover:text-white/80 hover:border-violet-500/40 hover:bg-violet-500/10"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Goal */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-white/70 mb-3">
                Goal
              </label>
              <div className="flex flex-wrap gap-2">
                {GOALS.map((goal) => (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => !isLoading && setSelectedGoal(goal)}
                    disabled={isLoading}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${
                      selectedGoal === goal
                        ? "border-blue-500 bg-blue-500/20 text-blue-200 shadow-[0_0_12px_rgba(59,130,246,0.15)]"
                        : "border-white/10 bg-white/5 text-white/55 hover:text-white/80 hover:border-blue-500/40 hover:bg-blue-500/10"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {goal}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate button */}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!selectedLevel || !selectedGoal || isLoading}
              className="relative w-full py-3.5 rounded-xl font-semibold text-white overflow-hidden transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-violet-600 to-blue-600" />
              <span className="absolute inset-0 bg-gradient-to-r from-violet-500 to-blue-500 opacity-0 hover:opacity-100 transition-opacity duration-300" />
              <span className="relative flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <span
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      style={{ animation: "spin 0.8s linear infinite" }}
                    />
                    Generating…
                  </>
                ) : (
                  "Generate Custom Roadmap"
                )}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}