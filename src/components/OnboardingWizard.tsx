"use client";

import { useState, useEffect, useRef } from "react";

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
                  ? "bg-brand-primary/15 border-brand-primary/50 shadow-[0_0_16px_rgba(99,102,241,0.12)]"
                  : "bg-brand-card border-slate-800 hover:bg-white/[0.06] hover:border-white/[0.12]"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl mt-0.5">{opt.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-semibold mb-0.5 transition-colors ${
                    isSel ? "text-brand-primary/90" : "text-brand-muted group-hover:text-brand-text"
                  }`}>
                    {opt.label}
                  </div>
                  <div className="text-xs text-white/40">{opt.desc}</div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                  isSel
                    ? "border-brand-primary bg-brand-primary/30"
                    : "border-white/20"
                }`}>
                  {isSel && <div className="w-2 h-2 rounded-full bg-brand-primary" />}
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
                  ? "bg-brand-primary/15 border-brand-primary/40 text-brand-primary/90"
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
              className="flex-1 bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-brand-primary/50 focus:bg-brand-primary/10 transition-all"
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
// ONBOARDING WIZARD PROPS
// ====================================================================
export interface OnboardingWizardProps {
  /** Called when user completes the wizard with the collected data */
  onGenerate: (data: {
    background: string;
    goal: string;
    timeCommitment: string;
    skill: string;
    richSkill: string;
  }) => void;
  /** Whether the API is currently generating */
  generating: boolean;
  /** Optional custom loading messages */
  loadingMessages?: string[];
}

// ====================================================================
// ONBOARDING WIZARD COMPONENT
// ====================================================================
export function OnboardingWizard({
  onGenerate,
  generating,
  loadingMessages: customMessages,
}: OnboardingWizardProps) {
  // Wizard state
  const [step, setStep] = useState(1);
  const [background, setBackground] = useState("");
  const [backgroundCustom, setBackgroundCustom] = useState("");
  const [goal, setGoal] = useState("");
  const [goalCustom, setGoalCustom] = useState("");
  const [timeCommitment, setTimeCommitment] = useState("");
  const [skill, setSkill] = useState("");

  // Loading messages cycle
  const defaultMessages = [
    "Analyzing your profile and background...",
    "Identifying the best path for your goal...",
    "Building your custom execution missions...",
    "Almost there — optimising your roadmap...",
  ];
  const loadingMessages = customMessages || defaultMessages;
  const [loadingMsg, setLoadingMsg] = useState(loadingMessages[0]);
  const loadingInterval = useRef<NodeJS.Timeout | null>(null);

  // Rotate loading messages when generating
  useEffect(() => {
    if (generating) {
      let msgIdx = 0;
      loadingInterval.current = setInterval(() => {
        msgIdx = (msgIdx + 1) % loadingMessages.length;
        setLoadingMsg(loadingMessages[msgIdx]);
      }, 2500);
    } else {
      if (loadingInterval.current) clearInterval(loadingInterval.current);
    }
    return () => {
      if (loadingInterval.current) clearInterval(loadingInterval.current);
    };
  }, [generating, loadingMessages]);

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

  const handleGenerate = () => {
    const bg = getBackgroundValue();
    const gl = getGoalValue();
    if (!bg || !gl || !timeCommitment || !skill.trim()) return;

    const richSkill = `I am a ${bg} who wants to ${gl}. I can dedicate ${timeCommitment}. Topic: ${skill.trim()}`;

    onGenerate({
      background: bg,
      goal: gl,
      timeCommitment,
      skill: skill.trim(),
      richSkill,
    });
  };

  // ---------- Step content ----------
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-primary/20 border border-brand-primary/20 mb-3">
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
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-primary/20 border border-brand-primary/20 mb-3">
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
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-primary/20 border border-brand-primary/20 mb-3">
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
                className="w-full bg-white/[0.05] border border-white/[0.1] rounded-2xl px-5 py-4 text-base text-white placeholder:text-white/20 outline-none focus:border-brand-primary/50 focus:bg-brand-primary/10 transition-all"
                autoFocus
              />
            </div>
          </div>
        );
    }
  };

  return (
    <>
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

      {/* Generating Overlay */}
      {generating && <GeneratingOverlay message={loadingMsg} />}
    </>
  );
}