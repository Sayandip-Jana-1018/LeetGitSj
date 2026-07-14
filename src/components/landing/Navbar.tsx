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
      <div className="mx-auto max-w-6xl px-6 py-4">
        <div className="glass-card flex items-center justify-between px-5 py-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--color-accent)] flex items-center justify-center group-hover:shadow-[var(--shadow-glow)] transition-shadow duration-300">
              <span className="text-[var(--color-accent-foreground)] font-bold text-sm">LP</span>
            </div>
            <span className="font-semibold text-[var(--color-text-primary)] text-lg tracking-tight">
              Leet<span className="text-[var(--color-accent)]">Push</span>
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
