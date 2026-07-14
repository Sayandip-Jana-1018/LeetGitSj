"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import * as React from "react";

/**
 * A mock dashboard preview that shows what the product looks like.
 * Built as a real component (not an image) for maximum fidelity.
 */
export function DashboardPreview() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  // Mock heatmap data (365 cells)
  const heatmapData = React.useMemo(() => 
    Array.from({ length: 52 * 7 }, () =>
      // eslint-disable-next-line react-hooks/purity
      Math.random() > 0.6 ? Math.floor(Math.random() * 4) + 1 : 0
    )
  , []);

  const recentActivity = [
    { id: 1, title: "Two Sum", lang: "Python", time: "2 min ago", qid: "1" },
    { id: 2, title: "Add Two Numbers", lang: "Java", time: "15 min ago", qid: "2" },
    { id: 3, title: "Longest Substring", lang: "C++", time: "1 hr ago", qid: "3" },
    { id: 4, title: "Median of Two Sorted Arrays", lang: "Python", time: "3 hrs ago", qid: "4" },
  ];

  const langColors: Record<string, string> = {
    Python: "hsl(200, 80%, 55%)",
    Java: "hsl(25, 85%, 55%)",
    "C++": "hsl(260, 70%, 60%)",
    TypeScript: "hsl(210, 80%, 55%)",
  };

  return (
    <section className="relative py-16 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative rounded-[var(--radius-xl)] overflow-hidden border border-[var(--color-border)] shadow-[var(--shadow-lg)] bg-[var(--color-surface)]"
        >
          {/* Window chrome */}
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[hsl(0,72%,51%)]" />
              <div className="w-3 h-3 rounded-full bg-[hsl(38,92%,50%)]" />
              <div className="w-3 h-3 rounded-full bg-[hsl(142,71%,45%)]" />
            </div>
            <div className="flex-1 flex justify-center">
              <div className="px-4 py-1 rounded-[var(--radius-md)] bg-[var(--color-surface)] text-xs text-[var(--color-text-muted)] border border-[var(--color-border-subtle)]">
                leetpush.dev/dashboard
              </div>
            </div>
          </div>

          {/* Dashboard Content */}
          <div className="flex">
            {/* Mini sidebar */}
            <div className="hidden md:flex flex-col w-56 border-r border-[var(--color-border)] p-4 gap-1">
              <div className="flex items-center gap-2.5 mb-6">
                <div className="w-7 h-7 rounded-[var(--radius-sm)] bg-[var(--color-accent)] flex items-center justify-center">
                  <span className="text-[var(--color-accent-foreground)] font-bold text-[10px]">LP</span>
                </div>
                <span className="font-semibold text-sm text-[var(--color-text-primary)]">LeetPush</span>
              </div>
              {["Overview", "Activity", "Settings"].map((item, i) => (
                <div
                  key={item}
                  className={`px-3 py-2 rounded-[var(--radius-md)] text-sm ${
                    i === 0
                      ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-medium"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                  }`}
                >
                  {item}
                </div>
              ))}
            </div>

            {/* Main area */}
            <div className="flex-1 p-6 space-y-6 min-h-[380px]">
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Total Synced", value: "547", color: "var(--color-accent)" },
                  { label: "Current Streak", value: "23 days", color: "var(--color-success)" },
                  { label: "Languages", value: "5", color: "hsl(260,70%,60%)" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] p-4"
                  >
                    <p className="text-xs text-[var(--color-text-muted)] mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold" style={{ color: stat.color }}>
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Heatmap */}
              <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] p-4">
                <p className="text-sm font-medium text-[var(--color-text-primary)] mb-3">
                  Contribution Activity
                </p>
                <div className="flex gap-[3px] overflow-hidden">
                  {Array.from({ length: 52 }).map((_, weekIdx) => (
                    <div key={weekIdx} className="flex flex-col gap-[3px]">
                      {Array.from({ length: 7 }).map((_, dayIdx) => {
                        const val = heatmapData[weekIdx * 7 + dayIdx];
                        const opacities = ["0.05", "0.25", "0.45", "0.7", "1"];
                        return (
                          <div
                            key={dayIdx}
                            className="w-[10px] h-[10px] rounded-[2px]"
                            style={{
                              backgroundColor: `var(--color-accent)`,
                              opacity: opacities[val],
                            }}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] p-4">
                <p className="text-sm font-medium text-[var(--color-text-primary)] mb-3">
                  Recent Syncs
                </p>
                <div className="space-y-2.5">
                  {recentActivity.map((act) => (
                    <div
                      key={act.id}
                      className="flex items-center justify-between py-1.5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]" />
                        <span className="text-sm text-[var(--color-text-primary)]">
                          {act.qid}. {act.title}
                        </span>
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-[var(--radius-full)] font-medium"
                          style={{
                            backgroundColor: `${langColors[act.lang] || "var(--color-accent)"}20`,
                            color: langColors[act.lang] || "var(--color-accent)",
                          }}
                        >
                          {act.lang}
                        </span>
                      </div>
                      <span className="text-xs text-[var(--color-text-muted)]">{act.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Subtle glow behind the card */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-64 bg-gradient-to-r from-transparent via-[var(--color-accent)] to-transparent opacity-[0.04] blur-3xl pointer-events-none" />
      </div>
    </section>
  );
}
