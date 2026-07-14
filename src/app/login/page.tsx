import Link from "next/link";
import { signIn } from "@/auth";
import { Code2 } from "lucide-react";
import { Github } from "@/components/icons/github";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuroraBackground } from "@/components/landing";

export default function LoginPage() {
  return (
    <div className="relative min-h-screen flex flex-col">
      <AuroraBackground />
      
      {/* Minimal nav */}
      <nav className="relative z-10 w-full p-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--color-accent)] flex items-center justify-center shadow-lg shadow-[var(--color-accent)]/20">
            <span className="text-[var(--color-accent-foreground)] font-bold text-sm">LP</span>
          </div>
          <span className="font-bold tracking-tight text-[var(--color-text-primary)]">
            LeetPush
          </span>
        </div>
        <ThemeToggle />
      </nav>

      {/* Main content */}
      <main className="flex-1 flex flex-col justify-center items-center p-6 relative z-10">
        <div className="w-full max-w-md">
          <div className="glass-card p-8 sm:p-10 border border-[var(--color-border)] rounded-2xl shadow-2xl relative overflow-hidden">
            {/* Subtle top glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-2 bg-gradient-to-r from-transparent via-[var(--color-accent)] to-transparent opacity-50 blur-sm" />
            
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-surface-elevated)] border border-[var(--color-border)] flex items-center justify-center shadow-inner">
                  <Code2 className="w-8 h-8 text-[var(--color-text-primary)]" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[var(--color-accent)] flex items-center justify-center border-2 border-[var(--color-surface)] shadow-sm">
                  <Github className="w-4 h-4 text-[var(--color-accent-foreground)]" />
                </div>
              </div>
            </div>

            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight mb-2">
                Welcome back
              </h1>
              <p className="text-[var(--color-text-secondary)] text-sm">
                Sign in to manage your LeetCode sync settings and view your contribution graph.
              </p>
            </div>

            <form
              action={async () => {
                "use server";
                await signIn("github", { redirectTo: "/dashboard" });
              }}
            >
              <button
                type="submit"
                className="w-full group relative flex items-center justify-center gap-3 px-6 py-3.5 text-base font-semibold rounded-xl bg-[var(--color-text-primary)] text-[var(--color-text-inverse)] hover:bg-[var(--color-text-secondary)] active:scale-[0.98] transition-all duration-200"
              >
                <Github className="w-5 h-5" />
                Continue with GitHub
                <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-black/10 dark:ring-white/10 pointer-events-none" />
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-[var(--color-text-muted)]">
              By signing in, you agree to our{" "}
              <Link href="/terms" className="underline hover:text-[var(--color-text-primary)]">Terms of Service</Link>
              {" "}and{" "}
              <Link href="/privacy" className="underline hover:text-[var(--color-text-primary)]">Privacy Policy</Link>.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
