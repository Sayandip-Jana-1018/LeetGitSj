"use client";

import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Github } from "@/components/icons/github";

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.3 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export function Hero() {
  return (
    <section className="relative min-h-[100dvh] flex items-center justify-center px-6 pt-28 pb-20 overflow-hidden">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 max-w-3xl mx-auto text-center"
      >
        {/* Badge */}
        <motion.div variants={item} className="mb-6">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-[var(--radius-full)] text-xs font-medium bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-accent)]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-pulse-dot" />
            Now syncing across all devices
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={item}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] text-[var(--color-text-primary)]"
        >
          Solve on any device.
          <br />
          <span className="bg-gradient-to-r from-[var(--color-accent)] via-[hsl(200,80%,55%)] to-[hsl(260,70%,60%)] bg-clip-text text-transparent">
            Commit to GitHub.
          </span>
          <br />
          Automatically.
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          variants={item}
          className="mt-6 text-lg sm:text-xl text-[var(--color-text-secondary)] max-w-xl mx-auto leading-relaxed"
        >
          Every accepted LeetCode submission becomes a real commit in your repo —
          with a green contribution square — no browser extension required.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          variants={item}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/login"
            className="group inline-flex items-center gap-2.5 px-7 py-3.5 text-base font-semibold rounded-[var(--radius-lg)] bg-[var(--color-accent)] text-[var(--color-accent-foreground)] hover:bg-[var(--color-accent-hover)] hover:shadow-[var(--shadow-glow)] active:scale-[0.97] transition-all duration-200 shadow-[var(--shadow-md)]"
          >
            <Github className="w-5 h-5" />
            Get Started with GitHub
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2 px-6 py-3.5 text-base font-medium rounded-[var(--radius-lg)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-elevated)] border border-[var(--color-border)] transition-all duration-200"
          >
            See how it works
          </a>
        </motion.div>

        {/* Trust signals */}
        <motion.p
          variants={item}
          className="mt-8 text-sm text-[var(--color-text-muted)]"
        >
          Free &amp; open-source · No browser extension · One-time setup
        </motion.p>
      </motion.div>
    </section>
  );
}
