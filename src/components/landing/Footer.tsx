"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { Github } from "@/components/icons/github";

export function Footer() {
  return (
    <footer className="relative border-t border-[var(--color-border-subtle)] py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Logo & tagline */}
          <div className="flex flex-col items-center sm:items-start gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-[var(--radius-sm)] bg-[var(--color-accent)] flex items-center justify-center">
                <span className="text-[var(--color-accent-foreground)] font-bold text-[10px]">LP</span>
              </div>
              <span className="font-semibold text-[var(--color-text-primary)]">
                Leet<span className="text-[var(--color-accent)]">Push</span>
              </span>
            </div>
            <p className="text-sm text-[var(--color-text-muted)] flex items-center gap-1">
              Built with <Heart className="w-3 h-3 text-[var(--color-danger)] fill-current" /> for the LeetCode community
            </p>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm text-[var(--color-text-muted)]">
            <Link
              href="/privacy"
              className="hover:text-[var(--color-text-primary)] transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="hover:text-[var(--color-text-primary)] transition-colors"
            >
              Terms
            </Link>
            <a
              href="https://github.com/apps/leetgit-sayandip"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--color-text-primary)] transition-colors inline-flex items-center gap-1"
            >
              <Github className="w-4 h-4" />
              GitHub
            </a>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-[var(--color-text-muted)]">
            © {new Date().getFullYear()} LeetGitSj. Not affiliated with LeetCode Inc. or GitHub Inc.
          </p>
        </div>
      </div>
    </footer>
  );
}
