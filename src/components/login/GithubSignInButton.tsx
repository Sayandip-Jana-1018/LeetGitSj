"use client";

import { useState, useTransition } from "react";
import { Github } from "@/components/icons/github";
import { Loader2 } from "lucide-react";

interface Props {
  action: () => Promise<void>;
}

export function GithubSignInButton({ action }: Props) {
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isLoading = loading || isPending;

  const handleClick = () => {
    setLoading(true);

    // Small delay so the spinner renders before the server action
    // triggers a redirect (which throws NEXT_REDIRECT and kills rendering)
    setTimeout(() => {
      startTransition(async () => {
        try {
          await action();
        } catch {
          // signIn() throws NEXT_REDIRECT — this is expected
        }
      });
    }, 50);
  };

  return (
    <div>
      <button
        type="button"
        disabled={isLoading}
        onClick={handleClick}
        className="w-full group relative flex items-center justify-center gap-3 px-6 py-3.5 text-base font-semibold rounded-xl bg-[var(--color-text-primary)] text-[var(--color-text-inverse)] hover:bg-[var(--color-text-secondary)] active:scale-[0.98] transition-all duration-200 disabled:opacity-80 disabled:cursor-not-allowed disabled:active:scale-100"
      >
        {isLoading ? (
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

      {/* Full-screen overlay loader */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md">
          <div className="relative flex flex-col items-center gap-5">
            {/* Spinning ring */}
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-white/20" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[var(--color-accent)] animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-white">Redirecting to GitHub</p>
              <p className="text-sm text-white/60 mt-1">Securely completing sign-in…</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
