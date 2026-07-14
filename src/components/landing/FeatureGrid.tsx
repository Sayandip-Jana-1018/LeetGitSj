"use client";

import { motion, useInView, Variants } from "framer-motion";
import { useRef } from "react";
import { Smartphone, GitBranch, Clock } from "lucide-react";

const features = [
  {
    icon: Smartphone,
    title: "Any Device, Anywhere",
    description:
      "Solve on your phone during lunch, tablet on the couch, or laptop at your desk. Sync happens server-side — your browser is never involved after setup.",
    gradient: "from-[hsl(172,85%,50%)] to-[hsl(200,80%,55%)]",
  },
  {
    icon: GitBranch,
    title: "Real Green Squares",
    description:
      "Every accepted submission becomes a genuine GitHub commit with proper file paths, meaningful messages, and a contribution square. Resubmissions count too.",
    gradient: "from-[hsl(142,71%,45%)] to-[hsl(172,85%,50%)]",
  },
  {
    icon: Clock,
    title: "Set Once, Forget Forever",
    description:
      "Connect your accounts once. The sync engine runs continuously in the background — your solutions appear in your repo within about a minute.",
    gradient: "from-[hsl(260,70%,60%)] to-[hsl(200,80%,55%)]",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const card: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export function FeatureGrid() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="features" className="relative py-24 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-[var(--color-accent)] tracking-wide uppercase">
            Why LeetPush
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-[var(--color-text-primary)] tracking-tight">
            Your practice deserves to be visible
          </h2>
          <p className="mt-4 text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto">
            Stop losing track of your LeetCode progress. Every submission, every
            language, every resubmission — automatically committed.
          </p>
        </motion.div>

        {/* Cards */}
        <motion.div
          ref={ref}
          variants={container}
          initial="hidden"
          animate={isInView ? "show" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={card}
              className="group relative glass-card p-8 hover:shadow-[var(--shadow-lg)] hover:border-[var(--color-accent)]/30 transition-all duration-300 flex flex-col items-center text-center"
            >
              {/* Icon */}
              <div
                className={`w-12 h-12 rounded-[var(--radius-md)] bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 group-hover:scale-110 group-hover:shadow-[var(--shadow-glow)] transition-all duration-300`}
              >
                <feature.icon className="w-6 h-6 text-white" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">
                {feature.title}
              </h3>
              <p className="text-[var(--color-text-secondary)] leading-relaxed">
                {feature.description}
              </p>

              {/* Subtle hover accent line */}
              <div className="absolute bottom-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-[var(--color-accent)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
