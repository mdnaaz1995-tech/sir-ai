interface HeroSearchProps {
  skill: string;
  onSkillChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

const SUGGESTIONS = [
  "Full Stack AI Engineer",
  "Machine Learning Engineer",
  "Cloud Architect",
  "Product Designer",
];

export function HeroSearch({
  skill,
  onSkillChange,
  onSubmit,
  isLoading,
}: HeroSearchProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) onSubmit();
  };

  return (
    <section className="relative w-full max-w-3xl mx-auto">
      <div
        className="absolute -inset-4 md:-inset-8 rounded-3xl bg-gradient-to-r from-violet-600/30 via-blue-600/20 to-violet-800/30 blur-3xl animate-pulse-glow pointer-events-none"
        aria-hidden
      />
      <div className="relative glass-card rounded-2xl md:rounded-3xl p-2 md:p-3 shadow-2xl shadow-violet-950/50">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-0">
          <div className="relative flex-1 flex items-center">
            <span
              className="absolute left-4 md:left-5 text-violet-400/80 pointer-events-none"
              aria-hidden
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </span>
            <input
              type="text"
              value={skill}
              onChange={(e) => onSkillChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter a skill — e.g. Full Stack AI Engineer"
              disabled={isLoading}
              className="w-full bg-transparent py-4 md:py-5 pl-12 md:pl-14 pr-4 text-base md:text-lg text-white placeholder:text-white/35 outline-none rounded-xl md:rounded-2xl disabled:opacity-60"
              aria-label="Skill to learn"
            />
          </div>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isLoading || !skill.trim()}
            className="group relative shrink-0 px-6 md:px-8 py-4 md:py-5 rounded-xl md:rounded-2xl font-semibold text-white overflow-hidden transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed sm:ml-2"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-violet-600 to-blue-600 transition-transform duration-300 group-hover:scale-105 group-disabled:scale-100" />
            <span className="absolute inset-0 bg-gradient-to-r from-violet-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="relative flex items-center justify-center gap-2">
              {isLoading ? (
                <>
                  <span
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                    style={{ animation: "spin-slow 0.8s linear infinite" }}
                  />
                  Generating…
                </>
              ) : (
                <>
                  Generate Roadmap
                  <svg
                    className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </>
              )}
            </span>
          </button>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-2 mt-5">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onSkillChange(s)}
            disabled={isLoading}
            className="text-xs md:text-sm px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-white/55 hover:text-white/90 hover:border-violet-500/40 hover:bg-violet-500/10 transition-colors disabled:opacity-40"
          >
            {s}
          </button>
        ))}
      </div>
    </section>
  );
}
