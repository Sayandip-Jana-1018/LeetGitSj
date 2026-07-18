/* eslint-disable react-hooks/purity */
/* eslint-disable @next/next/no-img-element */
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Flame,
  GitCommit,
  Zap,
  ChevronRight,
} from "lucide-react";
import { Github } from "@/components/icons/github";
import Link from "next/link";
import { decrypt } from "@/lib/encryption";
import { Heatmap } from "@/components/dashboard/Heatmap";
import { SyncTriggerButton } from "@/components/dashboard/SyncTriggerButton";
import { TiltCard, AnimatedCounter, FirstSyncCelebration } from "@/components/dashboard/DashboardEffects";
import { LeetCodeStats } from "@/components/dashboard/LeetCodeStats";
import { LeetCodeHeatmap } from "@/components/dashboard/LeetCodeHeatmap";

export const dynamic = "force-dynamic";

export default async function DashboardOverview() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const [leetcodeCredential, githubInstallation, , totalSynced, recentSubmissions] =
    await Promise.all([
      prisma.leetCodeCredential.findUnique({ where: { userId } }),
      prisma.gitHubInstallation.findUnique({ where: { userId } }),
      prisma.syncLog.findFirst({ where: { userId }, orderBy: { runAt: "desc" } }),
      prisma.syncedSubmission.count({ where: { userId } }),
      prisma.syncedSubmission.findMany({
        where: { userId },
        orderBy: { syncedAt: "desc" },
        take: 5,
        select: {
          id: true,
          questionId: true,
          problemTitle: true,
          language: true,
          difficulty: true,
          commitUrl: true,
          syncedAt: true,
          runtime: true,
          memory: true,
        },
      }),
    ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let leetcodeProfile: any = null;
  let leetcodeCalendar: string = "{}";

  if (leetcodeCredential?.status === "ACTIVE" && leetcodeCredential.leetcodeUsername) {
    try {
      const { fetchUserProfile, fetchUserCalendar } = await import("@/lib/leetcode");
      const sessionCookie = decrypt(leetcodeCredential.encryptedSession);
      const csrfToken = decrypt(leetcodeCredential.encryptedCsrfToken);
      const [profile, calendar] = await Promise.all([
        fetchUserProfile(sessionCookie, csrfToken, leetcodeCredential.leetcodeUsername),
        fetchUserCalendar(sessionCookie, csrfToken, leetcodeCredential.leetcodeUsername),
      ]);
      leetcodeProfile = profile;
      leetcodeCalendar = calendar;
    } catch (e) {
      console.error("Failed to fetch LeetCode stats", e);
    }
  }

  const needsSetup = !leetcodeCredential || !githubInstallation;
  const isFirstSync = totalSynced > 0 && recentSubmissions.length > 0 &&
    new Date(recentSubmissions[recentSubmissions.length - 1].syncedAt).getTime() > Date.now() - 60000;

  // Efficient streak: single query for last 365 days grouped by date
  const oneYearAgo = new Date();
  oneYearAgo.setDate(oneYearAgo.getDate() - 365);

  const heatmapRaw = await prisma.syncedSubmission.groupBy({
    by: ["syncedAt"],
    where: { userId, syncedAt: { gte: oneYearAgo } },
    _count: { _all: true },
  });

  const heatmapData = heatmapRaw.map((h) => ({ date: h.syncedAt, count: h._count._all }));

  // Build streak from heatmap dates
  const submissionDays = [
    ...new Set(heatmapData.map((h) => new Date(h.date).toISOString().split("T")[0])),
  ].sort((a, b) => b.localeCompare(a));

  let streak = 0;
  if (submissionDays.length > 0) {
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    if (submissionDays[0] === today || submissionDays[0] === yesterday) {
      streak = 1;
      for (let i = 1; i < submissionDays.length; i++) {
        const prev = new Date(submissionDays[i - 1]);
        const curr = new Date(submissionDays[i]);
        if ((prev.getTime() - curr.getTime()) / 86400000 === 1) streak++;
        else break;
      }
    }
  }

  const difficultyColor = (d?: string | null) =>
    d === "Easy"
      ? "text-[var(--color-success)] bg-[var(--color-success-subtle)]"
      : d === "Medium"
      ? "text-[var(--color-warning)] bg-[var(--color-warning-subtle)]"
      : d === "Hard"
      ? "text-[var(--color-danger)] bg-[var(--color-danger-subtle)]"
      : "text-[var(--color-text-muted)] bg-[var(--color-surface-hover)]";

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* First-sync confetti — client-only */}
      <FirstSyncCelebration isFirstSync={isFirstSync} totalSynced={totalSynced} streak={streak} />


      {/* Setup / Sync Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
          Overview
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1.5">
          Your LeetCode → GitHub sync at a glance.
        </p>
        <div className="mt-4">
          <SyncTriggerButton disabled={needsSetup} />
        </div>
      </div>

      {/* Setup alert */}
      {needsSetup && (
        <div className="rounded-2xl bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/25 p-6 flex flex-col items-center justify-center text-center gap-3 backdrop-blur-sm">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-warning)]/15 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5 text-[var(--color-warning)]" />
          </div>
          <div className="flex-1 w-full">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
              Action Required: Complete Setup
            </h3>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              Connect both GitHub and LeetCode before syncing can begin.
            </p>
            <Link
              href="/dashboard/settings"
              className="inline-flex items-center justify-center gap-1 mt-3 text-sm font-semibold text-[var(--color-accent)] hover:underline"
            >
              Go to Settings →
            </Link>
          </div>
        </div>
      )}

      {/* Stats Grid — 3D Tilt Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <TiltCard className="p-6 text-center">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center mx-auto mb-3">
            <GitCommit className="w-5 h-5 text-[var(--color-accent)]" />
          </div>
          <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Total Synced</p>
          <div className="flex items-baseline gap-1.5 justify-center">
            <AnimatedCounter
              value={totalSynced}
              className="text-4xl font-bold text-[var(--color-text-primary)]"
            />
            <span className="text-sm text-[var(--color-text-muted)]">commits</span>
          </div>
        </TiltCard>

        <TiltCard className="p-6 text-center">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center mx-auto mb-3">
            <Flame className="w-5 h-5 text-[var(--color-accent)]" />
          </div>
          <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Streak</p>
          <div className="flex items-baseline gap-1.5 justify-center">
            <AnimatedCounter
              value={streak}
              className={`text-4xl font-bold ${streak > 0 ? "text-[var(--color-success)]" : "text-[var(--color-text-muted)]"}`}
            />
            <span className="text-sm text-[var(--color-text-muted)]">days</span>
          </div>
        </TiltCard>

        <TiltCard className="p-6 text-center flex flex-col items-center justify-center">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-elevated)] flex items-center justify-center mx-auto mb-3 border border-[var(--color-border-subtle)]">
            <Github className="w-5 h-5 text-[var(--color-text-muted)]" />
          </div>
          <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">GitHub</p>
          {githubInstallation?.isActive ? (
            <div>
              <div className="flex items-center gap-1.5 text-sm mb-1 justify-center">
                <CheckCircle2 className="w-4 h-4 text-[var(--color-success)] shrink-0" />
                <span className="font-semibold text-[var(--color-success)]">Connected</span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] truncate max-w-[150px]" title={githubInstallation.repoFullName}>
                {githubInstallation.repoFullName}
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-sm justify-center">
              <XCircle className="w-4 h-4 text-[var(--color-danger)]" />
              <span className="text-[var(--color-text-muted)]">Not connected</span>
            </div>
          )}
        </TiltCard>

        <TiltCard className="p-6 text-center flex flex-col items-center justify-center">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center mx-auto mb-3">
            <Zap className="w-5 h-5 text-[var(--color-accent)]" />
          </div>
          <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">LeetCode</p>
          {leetcodeCredential?.status === "ACTIVE" ? (
            <div>
              <div className="flex items-center gap-1.5 text-sm mb-1 justify-center">
                <CheckCircle2 className="w-4 h-4 text-[var(--color-success)] shrink-0" />
                <span className="font-semibold text-[var(--color-success)]">Active</span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] truncate max-w-[150px]">
                {leetcodeCredential.leetcodeUsername}
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-1.5 text-sm mb-1 justify-center">
                <XCircle className="w-4 h-4 text-[var(--color-danger)]" />
                <span className="text-[var(--color-danger)] font-semibold">
                  {leetcodeCredential?.status === "EXPIRED" ? "Expired" : "Not connected"}
                </span>
              </div>
              {leetcodeCredential?.status === "EXPIRED" && (
                <Link href="/dashboard/settings" className="text-xs text-[var(--color-accent)] hover:underline">
                  Reconnect →
                </Link>
              )}
            </div>
          )}
        </TiltCard>
      </div>

      {/* Heatmap */}
      {!needsSetup && (
        <div className="glass-card p-4 sm:p-7 border border-[var(--color-border-subtle)] backdrop-blur-xl rounded-2xl bg-[var(--color-surface)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h3 className="text-base font-semibold text-[var(--color-text-primary)] flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center shrink-0">
                <GitCommit className="w-4 h-4 text-[var(--color-accent)]" />
              </div>
              GitHub Sync Graph
            </h3>
            <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] w-full sm:w-auto justify-end">
              Less
              <div className="flex gap-1">
                {[0, 20, 40, 60, 80, 100].map((o) => (
                  <div
                    key={o}
                    className="w-[14px] h-[14px] rounded-[4px]"
                    style={{
                      background: o === 0
                        ? "var(--color-surface-elevated)"
                        : `hsl(var(--hue), 85%, 45%, ${Math.max(0.4, o / 100)})`,
                      border: o === 0 
                        ? "1px solid var(--color-border-subtle)"
                        : `1px solid hsla(var(--hue), 85%, 45%, ${Math.max(0.3, o / 100 - 0.2)})`,
                      boxShadow: o > 0 ? `0 0 ${o / 5}px hsla(var(--hue), 85%, 45%, ${o / 100})` : "none"
                    }}
                  />
                ))}
              </div>
              More
            </div>
          </div>
          <div className="w-full">
            <Heatmap data={heatmapData} />
          </div>
        </div>
      )}
      {/* LeetCode Profile Stats */}
      {leetcodeProfile && (
        <LeetCodeStats stats={leetcodeProfile} />
      )}


      {/* LeetCode Heatmap */}
      {!needsSetup && leetcodeCalendar !== "{}" && (
        <LeetCodeHeatmap calendarJson={leetcodeCalendar} />
      )}

      {/* Recent Submissions */}
      {!needsSetup && recentSubmissions.length > 0 && (
        <div className="glass-card border border-[var(--color-border-subtle)] backdrop-blur-xl rounded-2xl overflow-hidden bg-[var(--color-surface)]">
          <div className="px-7 py-5 border-b border-[var(--color-border-subtle)] flex items-center justify-between bg-[var(--color-surface-elevated)]">
            <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Recent Submissions</h3>
            <Link href="/dashboard/activity" className="text-sm text-[var(--color-accent)] hover:underline">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-[var(--color-border-subtle)]">
            {recentSubmissions.map((sub) => (
              <a
                key={sub.id}
                href={sub.commitUrl || "#"}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col sm:flex-row sm:items-center justify-between px-7 py-4 group hover:bg-[var(--color-surface-elevated)] transition-colors gap-3 sm:gap-0"
              >
                <div className="flex items-start sm:items-center gap-4 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-sm">
                    <img
                      src={`https://cdn.jsdelivr.net/gh/PKief/vscode-material-icon-theme@main/icons/${sub.language}.svg`}
                      alt={sub.language}
                      className="w-4 h-4 opacity-80"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text-primary)] truncate group-hover:text-[var(--color-accent)] transition-colors">
                      {sub.questionId}. {sub.problemTitle}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${difficultyColor(sub.difficulty)}`}>
                        {sub.difficulty}
                      </span>
                      <span className="text-xs text-[var(--color-text-muted)]">
                        {formatDistanceToNow(new Date(sub.syncedAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-6 sm:gap-4 pl-12 sm:pl-0">
                  <div className="flex flex-col sm:items-end gap-1">
                    <span className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-1.5">
                      <div className="w-3.5 h-3.5 rounded-full bg-[var(--color-success)]/10 flex items-center justify-center">
                        <Zap className="w-2 h-2 text-[var(--color-success)]" />
                      </div>
                      {sub.runtime}
                    </span>
                    <span className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-1.5">
                      <div className="w-3.5 h-3.5 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-[var(--color-accent)] rounded-[1px]" />
                      </div>
                      {sub.memory}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)] group-hover:text-[var(--color-text-primary)] group-hover:translate-x-0.5 transition-all hidden sm:block" />
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
