"use client";

import { useState } from "react";
import { Github } from "@/components/icons/github";
import { Loader2 } from "lucide-react";

interface Props {
  action: () => Promise<void>;
}

export function GithubSignInButton({ action }: Props) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await action();
    } catch {
      // signIn redirects, so errors here are usually redirect interrupts
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <button
        type="submit"
        disabled={loading}
        className="w-full group relative flex items-center justify-center gap-3 px-6 py-3.5 text-base font-semibold rounded-xl bg-[var(--color-text-primary)] text-[var(--color-text-inverse)] hover:bg-[var(--color-text-secondary)] active:scale-[0.98] transition-all duration-200 disabled:opacity-80 disabled:cursor-not-allowed disabled:active:scale-100"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Connecting to GitHub…</span>
          </>
        ) : (
          <>
            <Github className="w-5 h-5" />
            <span>Continue with GitHub</span>
          </>
        )}
        <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-black/10 dark:ring-white/10 pointer-events-none" />
      </button>

      {/* Overlay loader shown after redirect begins */}
      {loading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--color-bg)]/80 backdrop-blur-sm">
          <div className="relative flex flex-col items-center gap-5">
            {/* Spinning ring */}
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-[var(--color-border)]" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[var(--color-accent)] animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-[var(--color-text-primary)]">Redirecting to GitHub</p>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">Securely completing sign-in…</p>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
