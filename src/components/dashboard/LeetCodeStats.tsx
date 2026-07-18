"use client";

import { Trophy, Star, Target, Activity } from "lucide-react";
import type { LeetCodeUserStats } from "@/lib/leetcode";

interface LeetCodeStatsProps {
  stats: LeetCodeUserStats;
}

export function LeetCodeStats({ stats }: LeetCodeStatsProps) {
  const TOTAL_EASY = 800;
  const TOTAL_MEDIUM = 1600;
  const TOTAL_HARD = 600;

  const easyPercent = Math.min((stats.easySolved / TOTAL_EASY) * 100, 100).toFixed(1);
  const medPercent = Math.min((stats.mediumSolved / TOTAL_MEDIUM) * 100, 100).toFixed(1);
  const hardPercent = Math.min((stats.hardSolved / TOTAL_HARD) * 100, 100).toFixed(1);
  
  const totalPercent = Math.min((stats.totalSolved / (TOTAL_EASY + TOTAL_MEDIUM + TOTAL_HARD)) * 100, 100).toFixed(1);

  return (
    <div className="glass-card border border-[var(--color-border-subtle)] backdrop-blur-2xl rounded-[32px] p-8 relative overflow-hidden group bg-[var(--color-surface)]">
      {/* Dynamic Ambient Background */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--color-accent)]/10 rounded-full blur-[100px] opacity-50 pointer-events-none group-hover:opacity-70 transition-opacity duration-700 transform translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[var(--color-text-primary)]/5 rounded-full blur-[80px] pointer-events-none" />
      
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
        
        {/* Profile & Ranking Info */}
        <div className="flex-1 w-full">
          <div className="flex items-start gap-6">
            <div className="relative">
              <div className="absolute inset-0 bg-[var(--color-accent)]/20 rounded-[24px] blur-xl" />
              <div className="relative w-20 h-20 rounded-[24px] bg-gradient-to-br from-[var(--color-surface-elevated)] to-[var(--color-surface)] border border-[var(--color-border-subtle)] flex items-center justify-center backdrop-blur-md shadow-lg group-hover:scale-105 transition-transform duration-500">
                <Trophy className="w-10 h-10 text-[var(--color-accent)] drop-shadow-[0_0_15px_var(--color-accent)]" />
              </div>
            </div>
            
            <div className="flex flex-col">
              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[var(--color-text-primary)] via-[var(--color-text-primary)] to-[var(--color-text-muted)] tracking-tight drop-shadow-sm">
                LeetCode
              </h2>
              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] shadow-sm">
                  <Target className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                  <span className="text-sm font-bold text-[var(--color-text-primary)]">Top {(stats.ranking / 1000).toFixed(1)}k</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] shadow-sm">
                  <Star className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                  <span className="text-sm font-bold text-[var(--color-text-primary)]">{stats.reputation} Rep</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Massive Stats Display */}
        <div className="flex flex-col items-start md:items-end w-full md:w-auto">
          <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-text-muted)] uppercase tracking-[0.2em] mb-2">
            <Activity className="w-4 h-4" /> Total Solved
          </div>
          <div className="flex items-baseline gap-2 pb-2">
            <span className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-text-primary)] via-[var(--color-accent)] to-[var(--color-accent)] drop-shadow-[0_0_30px_var(--color-accent)] leading-tight" style={{ WebkitTextStroke: "1px rgba(var(--color-text-primary),0.1)" }}>
              {stats.totalSolved}
            </span>
          </div>
          <div className="mt-3 w-full max-w-[280px] lg:max-w-xs bg-[var(--color-surface-elevated)] h-1.5 rounded-full overflow-hidden border border-[var(--color-border-subtle)]">
            <div 
              className="h-full bg-gradient-to-r from-[var(--color-accent)] to-[hsla(calc(var(--hue)+30),85%,60%,1)] rounded-full relative"
              style={{ width: `${totalPercent}%`, boxShadow: '0 0 10px var(--color-accent)' }}
            >
              <div className="absolute top-0 right-0 bottom-0 w-10 bg-gradient-to-r from-transparent to-white/50 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Difficulty Cards (Modern 3-Column Layout) */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* EASY CARD */}
        <div className="relative group/card bg-[var(--color-surface)] border border-[var(--color-border-subtle)] hover:border-[var(--color-success)]/40 rounded-2xl p-6 transition-[transform,box-shadow] duration-300 shadow-sm hover:shadow-lg hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-success)]/5 to-transparent rounded-2xl opacity-0 group-hover/card:opacity-100 transition-opacity" />
          <div className="flex justify-between items-end mb-6 relative">
            <span className="text-sm font-black uppercase tracking-[0.15em] text-[var(--color-success)] drop-shadow-[0_0_8px_var(--color-success)]">
              Easy
            </span>
            <div className="text-2xl font-black text-[var(--color-text-primary)]">{stats.easySolved}</div>
          </div>
          <div className="relative w-full h-2 rounded-full bg-[var(--color-surface-elevated)] overflow-hidden border border-[var(--color-border-subtle)]">
            <div className="absolute left-0 top-0 h-full bg-[var(--color-success)] shadow-[0_0_10px_var(--color-success)] rounded-full transition-all duration-1000" style={{ width: `${easyPercent}%` }} />
          </div>
          <div className="text-right text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mt-2">{TOTAL_EASY} Total</div>
        </div>

        {/* MEDIUM CARD */}
        <div className="relative group/card bg-[var(--color-surface)] border border-[var(--color-border-subtle)] hover:border-[var(--color-warning)]/40 rounded-2xl p-6 transition-[transform,box-shadow] duration-300 shadow-sm hover:shadow-lg hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-warning)]/5 to-transparent rounded-2xl opacity-0 group-hover/card:opacity-100 transition-opacity" />
          <div className="flex justify-between items-end mb-6 relative">
            <span className="text-sm font-black uppercase tracking-[0.15em] text-[var(--color-warning)] drop-shadow-[0_0_8px_var(--color-warning)]">
              Medium
            </span>
            <div className="text-2xl font-black text-[var(--color-text-primary)]">{stats.mediumSolved}</div>
          </div>
          <div className="relative w-full h-2 rounded-full bg-[var(--color-surface-elevated)] overflow-hidden border border-[var(--color-border-subtle)]">
            <div className="absolute left-0 top-0 h-full bg-[var(--color-warning)] shadow-[0_0_10px_var(--color-warning)] rounded-full transition-all duration-1000" style={{ width: `${medPercent}%` }} />
          </div>
          <div className="text-right text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mt-2">{TOTAL_MEDIUM} Total</div>
        </div>

        {/* HARD CARD */}
        <div className="relative group/card bg-[var(--color-surface)] border border-[var(--color-border-subtle)] hover:border-[var(--color-danger)]/40 rounded-2xl p-6 transition-[transform,box-shadow] duration-300 shadow-sm hover:shadow-lg hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-danger)]/5 to-transparent rounded-2xl opacity-0 group-hover/card:opacity-100 transition-opacity" />
          <div className="flex justify-between items-end mb-6 relative">
            <span className="text-sm font-black uppercase tracking-[0.15em] text-[var(--color-danger)] drop-shadow-[0_0_8px_var(--color-danger)]">
              Hard
            </span>
            <div className="text-2xl font-black text-[var(--color-text-primary)]">{stats.hardSolved}</div>
          </div>
          <div className="relative w-full h-2 rounded-full bg-[var(--color-surface-elevated)] overflow-hidden border border-[var(--color-border-subtle)]">
            <div className="absolute left-0 top-0 h-full bg-[var(--color-danger)] shadow-[0_0_10px_var(--color-danger)] rounded-full transition-all duration-1000" style={{ width: `${hardPercent}%` }} />
          </div>
          <div className="text-right text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mt-2">{TOTAL_HARD} Total</div>
        </div>

      </div>
    </div>
  );
}
