"use client";

import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";

interface RoadmapDisplayProps {
  skill: string;
  markdown: string;
}

export function RoadmapDisplay({ skill, markdown }: RoadmapDisplayProps) {
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [totalTasks, setTotalTasks] = useState(0);

  useEffect(() => {
    const savedProgress = localStorage.getItem(`progress-${skill}`);
    if (savedProgress) {
      setCompletedTasks(JSON.parse(savedProgress));
    }
    const tasks = markdown.match(/🏆 PROOF OF WORK:|Core Topics:/g) || [];
    setTotalTasks(tasks.length);
  }, [skill, markdown]);

  const toggleTask = (task: string) => {
    const newProgress = completedTasks.includes(task)
      ? completedTasks.filter((t) => t !== task)
      : [...completedTasks, task];
    
    setCompletedTasks(newProgress);
    localStorage.setItem(`progress-${skill}`, JSON.stringify(newProgress));
  };

  const progressPercentage = totalTasks > 0 
    ? Math.round((completedTasks.length / totalTasks) * 100) 
    : 0;

  return (
    <div className="max-w-4xl mx-auto mt-12 p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      <div className="mb-8">
        <div className="flex justify-between items-end mb-2">
          <h3 className="text-violet-400 font-bold text-sm tracking-widest uppercase">Your Mastery Progress</h3>
          <span className="text-2xl font-black text-white">{progressPercentage}%</span>
        </div>
        <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/5">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            className="h-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-blue-500 rounded-full shadow-[0_0_15px_rgba(139,92,246,0.5)]"
          />
        </div>
      </div>

      <AnimatePresence>
        {progressPercentage === 100 && (
          <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
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
          <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
            {skill} Mastery Roadmap
          </h2>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(markdown);
              alert("Roadmap copied to clipboard!");
            }}
            className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-xs text-white/70 transition-all"
          >
            Copy to Clipboard
          </button>
        </div>

        {/* Wrapper Div for Styling instead of putting className on ReactMarkdown */}
        <div className="text-white/80">
          <ReactMarkdown 
            components={{
              p: ({ children }) => {
                const text = String(children).trim();
                if (text.includes("PROOF OF WORK") || text.includes("Core Topics")) {
                  const taskId = text.slice(0, 30).replace(/\s+/g, '_');
                  const isChecked = completedTasks.includes(taskId);
                  
                  return (
                    <div 
                      onClick={() => toggleTask(taskId)}
                      className={`cursor-pointer p-3 mb-3 rounded-xl border transition-all duration-300 flex items-start gap-3 ${
                        isChecked 
                        ? "bg-green-500/10 border-green-500/50 text-green-200" 
                        : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
                      }`}
                    >
                      <div className={`mt-1 w-4 h-4 rounded-full border ${isChecked ? "bg-green-500 border-green-500" : "border-white/30"}`} />
                      <div className={isChecked ? "line-through opacity-60" : ""}>{children}</div>
                    </div>
                  );
                }
                return <p className="mb-4 leading-relaxed text-white/70">{children}</p>;
              }
            }}
          >
            {markdown}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}