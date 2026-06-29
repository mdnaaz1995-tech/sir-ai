"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// ---------- Icons ----------
const SparkleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3a6 6 0 0 0 9 9 6 6 0 0 0-9-9" />
    <path d="M20 7v6" />
    <path d="M14 10h4" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

// ---------- Step data ----------
const BACKGROUNDS = [
  { value: "Complete Beginner", label: "Complete Beginner", desc: "Naya naya start kiya hai", emoji: "🌱" },
  { value: "Student", label: "Student", desc: "College / School mein hoon", emoji: "🎒" },
  { value: "Non-Tech Professional", label: "Non-Tech Professional", desc: "Job karta hoon, tech mein naya", emoji: "💼" },
  { value: "Techie", label: "Techie", desc: "Already tech mein hoon, upgrade chahiye", emoji: "⚡" },
];

const GOALS = [
  { value: "Job/Placement", label: "Job / Placement", desc: "Company mein entry chahiye", emoji: "🏢" },
  { value: "Build a Startup/App", label: "Build a Startup / App", desc: "Apna khud ka product launch karna hai", emoji: "🚀" },
  { value: "Freelance/Earn Money", label: "Freelance / Earn Money", desc: "Clients se paisa kamaana hai", emoji: "💰" },
  { value: "Just Learning", label: "Just Learning", desc: "Bas seekhna hai, koi pressure nahi", emoji: "🧠" },
];

const TIMES = [
  { value: "1 Hour/Day", label: "1 Hour / Day", desc: "Thoda waqt lekin consistent", emoji: "⏰" },
  { value: "2-3 Hours/Day", label: "2-3 Hours / Day", desc: "Proper time de sakta hoon", emoji: "🔥" },
  { value: "Only Weekends", label: "Only Weekends", desc: "Weekend warrior mode", emoji: "🏝️" },
];

// ---------- Animated Step Indicator ----------
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: total }).map((_, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === current;
        const isCompleted = stepNum < current;
        return (
          <div key={i} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                isCompleted
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  : isActive
                  ? "bg-violet-500/20 text-violet-300 border border-violet-500/50 shadow-[0_0_12px_rgba(139,92,246,0.2)]"
                  : "bg-white/[0.04] text-white/30 border border-white/[0.08]"
              }`}
            >
              {isCompleted ? <CheckIcon /> : stepNum}
            </div>
            {i < total - 1 && (
              <div
                className={`w-8 sm:w-12 h-[2px] rounded-full transition-all duration-500 ${
                  isCompleted ? "bg-emerald-500/40" : "bg-white/[0.06]"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------- Selectable Card Grid ----------
function OptionGrid({
  options,
  selected,
  onSelect,
  customValue,
  onCustomChange,
}: {
  options: { value: string; label: string; desc: string; emoji: string }[];
  selected: string;
  onSelect: (v: string) => void;
  customValue: string;
  onCustomChange: (v: string) => void;
}) {
  const [showCustom, setShowCustom] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showCustom && inputRef.current) inputRef.current.focus();
  }, [showCustom]);

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((opt) => {
          const isSel = selected === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onSelect(opt.value);
                setShowCustom(false);
              }}
              className={`group relative text-left p-4 rounded-2xl border transition-all duration-200 ${
                isSel
                  ? "bg-violet-600/15 border-violet-500/50 shadow-[0_0_16px_rgba(139,92,246,0.12)]"
                  : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12]"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl mt-0.5">{opt.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-semibold mb-0.5 transition-colors ${
                    isSel ? "text-violet-300" : "text-white/70 group-hover:text-white/90"
                  }`}>
                    {opt.label}
                  </div>
                  <div className="text-xs text-white/40">{opt.desc}</div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                  isSel
                    ? "border-violet-500 bg-violet-500/30"
                    : "border-white/20"
                }`}>
                  {isSel && <div className="w-2 h-2 rounded-full bg-violet-400" />}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Custom input toggle */}
      <div className="mt-3 text-center">
        {!showCustom ? (
          <button
            type="button"
            onClick={() => {
              setShowCustom(true);
              onSelect("__custom__");
            }}
            className={`text-xs font-medium px-4 py-1.5 rounded-lg border transition-all ${
              selected === "__custom__"
                ? "bg-violet-600/15 border-violet-500/40 text-violet-300"
                : "text-white/30 border-white/[0.06] hover:text-white/50 hover:border-white/[0.12]"
            }`}
          >
            ✏️ Kuch aur batao...
          </button>
        ) : (
          <div className="flex items-center gap-2 mt-2">
            <input
              ref={inputRef}
              type="text"
              value={customValue}
              onChange={(e) => onCustomChange(e.target.value)}
              placeholder="Apne words mein likho..."
              className="flex-1 bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-violet-500/50 focus:bg-violet-900/10 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowCustom(false)}
              className="px-3 py-2.5 rounded-xl text-xs text-white/40 hover:text-white/70 hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Loading Overlay ----------
function GeneratingOverlay({ message }: { message: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-md mx-auto text-center">
        {/* Pulsing ring */}
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border-2 border-violet-500/30 animate-ping" />
          <div className="absolute inset-2 rounded-full border-2 border-fuchsia-500/20 animate-ping animation-delay-150" />
          <div className="absolute inset-4 rounded-full bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center">
            <SparkleIcon />
          </div>
        </div>
        <p className="text-lg font-semibold text-white/90">{message}</p>
        <p className="text-sm text-white/40 mt-2">SIR AI intelligence working...</p>
      </div>
    </div>
  );
}

// ====================================================================
// PAGE COMPONENT
// ====================================================================
export default function GeneratePage() {
  const router = useRouter();

  // Wizard state
  const [step, setStep] = useState(1);
  const [background, setBackground] = useState("");
  const [backgroundCustom, setBackgroundCustom] = useState("");
  const [goal, setGoal] = useState("");
  const [goalCustom, setGoalCustom] = useState("");
  const [timeCommitment, setTimeCommitment] = useState("");

  // Skill topic (kept minimal — appears only at the end)
  const [skill, setSkill] = useState("");

  // Generation
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Loading messages cycle
  const loadingMessages = [
    "Analyzing your profile and background...",
    "Identifying the best path for your goal...",
    "Building your custom execution missions...",
    "Almost there — optimising your roadmap...",
  ];
  const [loadingMsg, setLoadingMsg] = useState(loadingMessages[0]);
  const loadingInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push("/");
    });
  }, [router]);

  // ---------- Helpers ----------
  const getBackgroundValue = () =>
    background === "__custom__" ? backgroundCustom.trim() : background;
  const getGoalValue = () =>
    goal === "__custom__" ? goalCustom.trim() : goal;

  const canProceedFromStep = (s: number) => {
    switch (s) {
      case 1:
        if (background === "__custom__") return backgroundCustom.trim().length > 0;
        return !!background;
      case 2:
        if (goal === "__custom__") return goalCustom.trim().length > 0;
        return !!goal;
      case 3:
        return !!timeCommitment;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (!canProceedFromStep(step)) return;
    setStep((s) => Math.min(s + 1, 3));
  };

  const handleBack = () => {
    setStep((s) => Math.max(s - 1, 1));
  };

  // ---------- Generate ----------
  const handleGenerate = async () => {
    const bg = getBackgroundValue();
    const gl = getGoalValue();
    if (!bg || !gl || !timeCommitment || !skill.trim()) return;

    setGenerating(true);
    setError(null);

    // Rotate loading messages
    let msgIdx = 0;
    loadingInterval.current = setInterval(() => {
      msgIdx = (msgIdx + 1) % loadingMessages.length;
      setLoadingMsg(loadingMessages[msgIdx]);
    }, 2500);

    // Build the rich prompt string
    const richSkill = `I am a ${bg} who wants to ${gl}. I can dedicate ${timeCommitment}. Topic: ${skill.trim()}`;

    try {
      const res = await fetch("/api/generate-roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skill: richSkill,
          level: bg,
          goal: `${gl} | Time: ${timeCommitment}`,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data.error || `Request failed (${res.status})`;
        alert(errorMsg);
        throw new Error(errorMsg);
      }

      if (data.id) {
        router.push(`/dashboard/roadmap/${data.id}`);
      } else {
        router.push(`/dashboard`);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
      if (loadingInterval.current) clearInterval(loadingInterval.current);
    }
  };

  // ---------- Step content ----------
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/20 mb-3">
                <span className="text-2xl">👤</span>
              </div>
              <h2 className="text-xl font-bold tracking-tight">
                Aapka current background kya hai?
              </h2>
              <p className="text-white/40 text-sm mt-1">
                Step 1 of 3 — Hum aapke hisaab se roadmap banayenge
              </p>
            </div>
            <OptionGrid
              options={BACKGROUNDS}
              selected={background}
              onSelect={setBackground}
              customValue={backgroundCustom}
              onCustomChange={setBackgroundCustom}
            />
          </div>
        );

      case 2:
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-600/20 border border-blue-500/20 mb-3">
                <span className="text-2xl">🎯</span>
              </div>
              <h2 className="text-xl font-bold tracking-tight">
                Aapka ultimate goal kya hai?
              </h2>
              <p className="text-white/40 text-sm mt-1">
                Step 2 of 3 — Target clear karte hain
              </p>
            </div>
            <OptionGrid
              options={GOALS}
              selected={goal}
              onSelect={setGoal}
              customValue={goalCustom}
              onCustomChange={setGoalCustom}
            />
          </div>
        );

      case 3:
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border border-emerald-500/20 mb-3">
                <span className="text-2xl">⏳</span>
              </div>
              <h2 className="text-xl font-bold tracking-tight">
                Aap roz kitna time de sakte hain?
              </h2>
              <p className="text-white/40 text-sm mt-1">
                Step 3 of 3 — Schedule ke hisaab se pace set karenge
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {TIMES.map((opt) => {
                const isSel = timeCommitment === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTimeCommitment(opt.value)}
                    className={`group relative text-left p-4 rounded-2xl border transition-all duration-200 ${
                      isSel
                        ? "bg-emerald-600/15 border-emerald-500/50 shadow-[0_0_16px_rgba(16,185,129,0.12)]"
                        : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{opt.emoji}</span>
                      <div className="flex-1">
                        <div className={`text-sm font-semibold mb-0.5 transition-colors ${
                          isSel ? "text-emerald-300" : "text-white/70 group-hover:text-white/90"
                        }`}>
                          {opt.label}
                        </div>
                        <div className="text-xs text-white/40">{opt.desc}</div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        isSel
                          ? "border-emerald-500 bg-emerald-500/30"
                          : "border-white/20"
                      }`}>
                        {isSel && <div className="w-2 h-2 rounded-full bg-emerald-400" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Topic input — appears only on step 3 */}
            <div className="mt-6 pt-6 border-t border-white/[0.06]">
              <label className="block text-sm font-medium text-white/50 mb-2">
                Aur hum kya seekhenge? <span className="text-white/30">(Topic)</span>
              </label>
              <input
                type="text"
                value={skill}
                onChange={(e) => setSkill(e.target.value)}
                placeholder="e.g., Full-Stack Blockchain, AI Engineering, Rust..."
                className="w-full bg-white/[0.05] border border-white/[0.1] rounded-2xl px-5 py-4 text-base text-white placeholder:text-white/20 outline-none focus:border-violet-500/50 focus:bg-violet-900/10 transition-all"
                autoFocus
              />
            </div>
          </div>
        );
    }
  };

  // ---------- Render ----------
  return (
    <div className="min-h-screen bg-[#050508] text-white flex font-sans">
      {/* ===== SIDEBAR ===== */}
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
            <span className="text-violet-400"><SparkleIcon /></span>
            Generate New
          </button>

          <button
            onClick={() => router.push("/showcase")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 7 7 7 7" />
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 17 7 17 7" />
              <path d="M4 22h16" />
              <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
            </svg>
            Wall of Fame
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
          <span className="font-semibold text-sm">SIR <span className="text-violet-400">AI</span></span>
          <div className="w-8" />
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
            <div className="w-full max-w-lg mx-auto">
              <div className="relative">
                {/* Ambient glows */}
                <div className="absolute -top-40 -left-20 w-80 h-80 rounded-full bg-violet-700/10 blur-[120px] pointer-events-none" />
                <div className="absolute -bottom-20 -right-20 w-60 h-60 rounded-full bg-blue-700/10 blur-[100px] pointer-events-none" />

                <div className="relative">
                  {/* Header */}
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-xs font-medium text-violet-300 mb-5">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                      Powered by Groq · Llama 3
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
                      SIR AI{" "}
                      <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-blue-400 bg-clip-text text-transparent">
                        Onboarding
                      </span>
                    </h1>
                    <p className="text-white/40 text-sm leading-relaxed max-w-sm mx-auto">
                      Do minute lagega — bas 3 sawaal. Phir hum aapka custom roadmap bana denge.
                    </p>
                  </div>

                  {/* Wizard card */}
                  <div className="bg-brand-card border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-black/40">
                    <StepIndicator current={step} total={3} />
                    {renderStep()}

                    {/* Navigation buttons */}
                    <div className="mt-8 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={handleBack}
                        disabled={step === 1}
                        className={`px-5 py-3 rounded-xl text-sm font-medium transition-all ${
                          step === 1
                            ? "text-white/20 cursor-not-allowed"
                            : "text-white/50 hover:text-white/80 hover:bg-white/[0.05]"
                        }`}
                      >
                        ← Peechhe
                      </button>

                      {step < 3 ? (
                        <button
                          type="button"
                          onClick={handleNext}
                          disabled={!canProceedFromStep(step)}
                          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-primary hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all"
                        >
                          Aage → 
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={generating || !canProceedFromStep(3)}
                          onClick={handleGenerate}
                          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-primary hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold text-sm shadow-[0_0_20px_rgba(99,102,241,0.25)] transition-all"
                        >
                          {generating ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <SparkleIcon />
                              Generate My Roadmap
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {error && (
                    <div
                      role="alert"
                      className="mt-4 px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-200 text-sm text-center"
                    >
                      {error}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ===== GENERATING OVERLAY ===== */}
      {generating && <GeneratingOverlay message={loadingMsg} />}
    </div>
  );
}