"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "error" | "success" } | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onClose();
        router.push("/dashboard");
      } else {
        const { error, data } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        // If session exists, the user was auto-confirmed (dev mode) → redirect
        if (data.session) {
          onClose();
          router.push("/dashboard");
        } else {
          setMessage({ text: "Success! Check your email to verify.", type: "success" });
        }
      }
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-md p-8 relative rounded-3xl bg-white/5 border border-white/10 shadow-2xl backdrop-blur-xl"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-all"
            >
              ✕
            </button>

            <h2 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 text-center">
              {isLogin ? "Welcome Back to SIR AI" : "Join SIR AI"}
            </h2>

            <form onSubmit={handleAuth} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-violet-400 uppercase tracking-widest mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white focus:outline-none focus:border-violet-500 transition-colors"
                  placeholder="founder@billiondollar.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-violet-400 uppercase tracking-widest mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white focus:outline-none focus:border-violet-500 transition-colors"
                  placeholder="••••••••"
                />
              </div>

              {message && (
                <div className={`p-3 rounded-xl text-sm border ${message.type === "error" ? "bg-red-500/10 border-red-500/50 text-red-400" : "bg-green-500/10 border-green-500/50 text-green-400"}`}>
                  {message.text}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-blue-600 hover:opacity-90 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all disabled:opacity-50"
              >
                {loading ? "Processing..." : isLogin ? "Access Account" : "Create Account"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setMessage(null);
                }}
                className="text-sm text-white/50 hover:text-white transition-colors"
              >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}