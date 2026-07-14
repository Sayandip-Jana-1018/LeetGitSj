"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { motion } from "framer-motion";
import { Github } from "@/components/icons/github";

export function Navbar() {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <div className="mx-auto max-w-6xl px-4 pt-6">
        <div className="bg-white/10 dark:bg-black/20 backdrop-blur-lg border border-white/20 dark:border-white/10 rounded-full flex items-center justify-between px-6 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <img src="/profile_photo.jpg" alt="Logo" className="w-8 h-8 rounded-full object-cover shadow-sm group-hover:shadow-[var(--shadow-glow)] transition-shadow duration-300" />
            <span className="font-semibold text-[var(--color-text-primary)] text-lg tracking-tight">
              LeetGit<span className="text-[var(--color-accent)]">Sj</span>
            </span>
          </Link>

          {/* Nav Links */}
          <div className="hidden sm:flex items-center gap-6">
            <a
              href="#features"
              className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              How It Works
            </a>
            <a
              href="#faq"
              className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              FAQ
            </a>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-[var(--radius-md)] bg-[var(--color-accent)] text-[var(--color-accent-foreground)] hover:bg-[var(--color-accent-hover)] active:scale-[0.97] transition-all duration-150 shadow-[var(--shadow-sm)]"
            >
              <Github className="w-4 h-4" />
              <span className="hidden sm:inline">Sign in</span>
            </Link>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
