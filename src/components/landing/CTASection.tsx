"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, Shield, Lock } from "lucide-react";
import { Github } from "@/components/icons/github";

export function CTASection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="relative py-24 px-6" ref={ref}>
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative rounded-[var(--radius-xl)] overflow-hidden"
        >
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-accent)] via-[hsl(200,80%,50%)] to-[hsl(260,70%,55%)] opacity-90" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA4KSIvPjwvc3ZnPg==')] opacity-40" />

          {/* Content */}
          <div className="relative z-10 px-8 py-16 sm:px-16 sm:py-20 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Ready to sync your progress?
            </h2>
            <p className="mt-4 text-lg text-white/80 max-w-xl mx-auto">
              Join developers who never miss a green square. Setup takes under two minutes.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/login"
                className="group inline-flex items-center gap-2.5 px-7 py-3.5 text-base font-semibold rounded-[var(--radius-lg)] bg-white text-[hsl(222,47%,11%)] hover:bg-white/90 active:scale-[0.97] transition-all duration-200 shadow-lg"
              >
                <Github className="w-5 h-5" />
                Get Started Free
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            {/* Trust badges */}
            <div className="mt-8 flex items-center justify-center gap-6 text-sm text-white/60">
              <span className="inline-flex items-center gap-1.5">
                <Shield className="w-4 h-4" />
                AES-256 encrypted
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Lock className="w-4 h-4" />
                One-click data deletion
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
