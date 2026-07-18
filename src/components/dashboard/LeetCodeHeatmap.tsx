"use client";

import { useMemo } from "react";
import { Heatmap } from "./Heatmap";
import { TiltCard } from "./DashboardEffects";
import { Calendar, Activity } from "lucide-react";

interface LeetCodeHeatmapProps {
  calendarJson: string;
}

export function LeetCodeHeatmap({ calendarJson }: LeetCodeHeatmapProps) {
  const data = useMemo(() => {
    try {
      const parsed = JSON.parse(calendarJson) as Record<string, number>;
      return Object.entries(parsed).map(([timestampStr, count]) => ({
        date: new Date(parseInt(timestampStr, 10) * 1000),
        count,
      }));
    } catch {
      return [];
    }
  }, [calendarJson]);

  // Calculate some quick stats
  const totalSubmissions = useMemo(() => data.reduce((sum, day) => sum + day.count, 0), [data]);
  const maxDay = useMemo(() => Math.max(...data.map(d => d.count), 0), [data]);

  return (
    <TiltCard maxTilt={3} className="glass-card border border-[var(--color-border-subtle)] backdrop-blur-2xl rounded-[32px] p-8 mt-10 relative overflow-hidden group bg-[var(--color-surface)]">
      
      {/* Dynamic Ambient Background */}
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-[var(--color-accent)]/5 rounded-full blur-[100px] opacity-40 pointer-events-none group-hover:opacity-60 transition-opacity duration-700 transform -translate-x-1/2 -translate-y-1/2" />
      
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-6">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="absolute inset-0 bg-[var(--color-accent)]/20 rounded-[20px] blur-lg" />
            <div className="relative w-16 h-16 rounded-[20px] bg-gradient-to-br from-[var(--color-surface-elevated)] to-[var(--color-surface)] border border-[var(--color-border-subtle)] flex items-center justify-center backdrop-blur-md shadow-lg">
              <Calendar className="w-8 h-8 text-[var(--color-accent)] drop-shadow-[0_0_15px_var(--color-accent)]" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[var(--color-text-primary)] via-[var(--color-text-primary)] to-[var(--color-text-muted)] tracking-tight">
              LeetCode Activity
            </h2>
            <p className="text-sm font-medium text-[var(--color-text-muted)] mt-1 flex items-center gap-2">
              <Activity className="w-4 h-4 text-[var(--color-accent)]" /> Direct platform submissions
            </p>
          </div>
        </div>
        
        <div className="flex gap-8 items-center bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] rounded-2xl px-6 py-4">
          <div className="flex flex-col items-center md:items-start">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--color-text-muted)] mb-1">Max in a Day</span>
            <span className="text-3xl font-black text-[var(--color-text-primary)] drop-shadow-sm">{maxDay}</span>
          </div>
          <div className="w-px h-12 bg-[var(--color-border-subtle)]"></div>
          <div className="flex flex-col items-center md:items-start">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--color-text-muted)] mb-1">Past Year</span>
            <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-text-primary)] to-[var(--color-accent)] drop-shadow-[0_0_15px_var(--color-accent)]">{totalSubmissions.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="relative z-10 w-full pt-2">
        <Heatmap data={data} />
      </div>
    </TiltCard>
  );
}
