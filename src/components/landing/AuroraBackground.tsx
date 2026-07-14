"use client";

import { motion } from "framer-motion";

/**
 * Animated aurora/gradient mesh background.
 * Three slow-drifting blobs with mix-blend-mode for organic feel.
 * Respects prefers-reduced-motion via CSS.
 */
export function AuroraBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Base gradient layer */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-bg)] via-[var(--color-surface)] to-[var(--color-bg)]" />

      {/* Animated blobs */}
      <motion.div
        className="aurora-blob w-[600px] h-[600px] top-[-10%] left-[-5%]"
        style={{ background: "radial-gradient(circle, hsla(172, 85%, 50%, 0.3) 0%, transparent 70%)" }}
        animate={{
          x: [0, 50, -30, 20, 0],
          y: [0, -30, 50, -20, 0],
          scale: [1, 1.1, 0.95, 1.05, 1],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="aurora-blob w-[500px] h-[500px] top-[20%] right-[-10%]"
        style={{ background: "radial-gradient(circle, hsla(260, 70%, 60%, 0.2) 0%, transparent 70%)" }}
        animate={{
          x: [0, -40, 30, -15, 0],
          y: [0, 40, -20, 30, 0],
          scale: [1, 0.95, 1.1, 1, 1],
        }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      <motion.div
        className="aurora-blob w-[450px] h-[450px] bottom-[5%] left-[30%]"
        style={{ background: "radial-gradient(circle, hsla(200, 80%, 55%, 0.2) 0%, transparent 70%)" }}
        animate={{
          x: [0, 30, -50, 25, 0],
          y: [0, -25, 35, -10, 0],
          scale: [1, 1.05, 0.9, 1.08, 1],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 5 }}
      />
    </div>
  );
}
