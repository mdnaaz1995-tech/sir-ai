export function LoadingState({ skill }: { skill: string }) {
  return (
    <div className="w-full max-w-4xl mx-auto mt-12 px-4">
      <div className="glass-card rounded-2xl p-8 md:p-10 animate-shimmer">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="relative w-16 h-16">
            <div
              className="absolute inset-0 rounded-full border-2 border-violet-500/20"
              aria-hidden
            />
            <div
              className="absolute inset-0 rounded-full border-2 border-transparent border-t-violet-400 border-r-blue-400"
              style={{ animation: "spin-slow 0.9s linear infinite" }}
              aria-hidden
            />
            <div className="absolute inset-2 rounded-full bg-violet-500/10 flex items-center justify-center">
              <span className="text-xl" aria-hidden>
                ⚡
              </span>
            </div>
          </div>
          <div>
            <p className="text-lg font-medium text-white/90">
              Architecting your mastery path
            </p>
            <p className="mt-2 text-sm text-white/50">
              SIR AI is building a world-class roadmap for{" "}
              <span className="text-violet-300 font-medium">{skill}</span>
            </p>
          </div>
          <div className="w-full max-w-md space-y-3">
            {[100, 85, 70].map((w) => (
              <div
                key={w}
                className="h-3 rounded-full bg-white/5 overflow-hidden"
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-600/40 to-blue-500/40 animate-shimmer"
                  style={{ width: `${w}%` }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
