"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { UserPlus, Cookie, Zap } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: UserPlus,
    title: "Sign in with GitHub",
    description:
      "One click to authenticate. Install the LeetPush GitHub App on the repo where you want your solutions committed.",
    accent: "hsl(172, 85%, 50%)",
  },
  {
    number: "02",
    icon: Cookie,
    title: "Paste your LeetCode cookies",
    description:
      "A one-time step — copy two cookie values from your browser's dev tools. They're encrypted instantly and never stored in plaintext.",
    accent: "hsl(200, 80%, 55%)",
  },
  {
    number: "03",
    icon: Zap,
    title: "Solve & forget",
    description:
      "That's it. Solve problems on any device — phone, tablet, laptop. Your solutions appear in your GitHub repo within about a minute.",
    accent: "hsl(260, 70%, 60%)",
  },
];

export function HowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="how-it-works" className="relative py-24 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-[var(--color-accent)] tracking-wide uppercase">
            How It Works
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-[var(--color-text-primary)] tracking-tight">
            Three steps. Then it&apos;s automatic.
          </h2>
        </motion.div>

        {/* Steps */}
        <div ref={ref} className="space-y-0">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.2 }}
              className="relative flex items-start gap-6 pb-12 last:pb-0"
            >
              {/* Timeline line */}
              {i < steps.length - 1 && (
                <div className="absolute left-[27px] top-[56px] bottom-0 w-[2px] bg-gradient-to-b from-[var(--color-border)] to-transparent" />
              )}

              {/* Step number circle */}
              <div
                className="relative z-10 flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center border-2 bg-[var(--color-surface)]"
                style={{ borderColor: step.accent }}
              >
                <step.icon className="w-6 h-6" style={{ color: step.accent }} />
              </div>

              {/* Content */}
              <div className="pt-2">
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className="text-xs font-bold tracking-widest"
                    style={{ color: step.accent }}
                  >
                    STEP {step.number}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
                  {step.title}
                </h3>
                <p className="text-[var(--color-text-secondary)] leading-relaxed max-w-lg">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
