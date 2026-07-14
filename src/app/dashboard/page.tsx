import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Flame,
  GitCommit,
  Trophy,
  Zap,
} from "lucide-react";
import { Github } from "@/components/icons/github";
import Link from "next/link";
import { Heatmap } from "@/components/dashboard/Heatmap";
import { SyncTriggerButton } from "@/components/dashboard/SyncTriggerButton";
import { TiltCard, AnimatedCounter, FirstSyncCelebration } from "@/components/dashboard/DashboardEffects";

export const dynamic = "force-dynamic";

export default async function DashboardOverview() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const [leetcodeCredential, githubInstallation, lastSync, totalSynced, recentSubmissions] =
    await Promise.all([
      prisma.leetCodeCredential.findUnique({ where: { userId } }),
      prisma.gitHubInstallation.findUnique({ where: { userId } }),
      prisma.syncLog.findFirst({ where: { userId }, orderBy: { runAt: "desc" } }),
      prisma.syncedSubmission.count({ where: { userId } }),
      prisma.syncedSubmission.findMany({
        where: { userId },
        orderBy: { syncedAt: "desc" },
        take: 8,
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
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* First-sync confetti — client-only */}
      <FirstSyncCelebration isFirstSync={isFirstSync} totalSynced={totalSynced} streak={streak} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Overview
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Your LeetCode → GitHub sync at a glance.
          </p>
        </div>
        <SyncTriggerButton disabled={needsSetup} />
      </div>

      {/* Setup alert */}
      {needsSetup && (
        <div className="rounded-[var(--radius-lg)] bg-[var(--color-warning-subtle)] border border-[var(--color-warning)]/30 p-5 flex items-start gap-4">
          <AlertCircle className="w-5 h-5 text-[var(--color-warning)] mt-0.5 shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
              Action Required: Complete Setup
            </h3>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              Connect both GitHub and LeetCode before syncing can begin.
            </p>
            <Link
              href="/dashboard/settings"
              className="inline-block mt-3 text-sm font-medium text-[var(--color-accent)] hover:underline"
            >
              Go to Settings →
            </Link>
          </div>
        </div>
      )}

      {/* Stats Grid — 3D Tilt Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <TiltCard className="p-5">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">Total Synced</p>
            <GitCommit className="w-4 h-4 text-[var(--color-accent)] opacity-70" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <AnimatedCounter
              value={totalSynced}
              className="text-3xl font-bold text-[var(--color-text-primary)]"
            />
            <span className="text-sm text-[var(--color-text-muted)]">commits</span>
          </div>
        </TiltCard>

        <TiltCard className="p-5">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">Streak</p>
            <Flame className="w-4 h-4 text-orange-400 opacity-80" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <AnimatedCounter
              value={streak}
              className={`text-3xl font-bold ${streak > 0 ? "text-[var(--color-success)]" : "text-[var(--color-text-muted)]"}`}
            />
            <span className="text-sm text-[var(--color-text-muted)]">days</span>
          </div>
        </TiltCard>

        <TiltCard className="p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">GitHub</p>
            <Github className="w-4 h-4 text-[var(--color-text-muted)] opacity-70" />
          </div>
          {githubInstallation?.isActive ? (
            <div>
              <div className="flex items-center gap-1.5 text-sm mb-1">
                <CheckCircle2 className="w-4 h-4 text-[var(--color-success)] shrink-0" />
                <span className="font-medium text-[var(--color-success)]">Connected</span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] truncate" title={githubInstallation.repoFullName}>
                {githubInstallation.repoFullName}
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-sm">
              <XCircle className="w-4 h-4 text-[var(--color-danger)]" />
              <span className="text-[var(--color-text-muted)]">Not connected</span>
            </div>
          )}
        </TiltCard>

        <TiltCard className="p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">LeetCode</p>
            <Zap className="w-4 h-4 text-yellow-400 opacity-70" />
          </div>
          {leetcodeCredential?.status === "ACTIVE" ? (
            <div>
              <div className="flex items-center gap-1.5 text-sm mb-1">
                <CheckCircle2 className="w-4 h-4 text-[var(--color-success)] shrink-0" />
                <span className="font-medium text-[var(--color-success)]">Active</span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] truncate">
                {leetcodeCredential.leetcodeUsername}
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-1.5 text-sm mb-1">
                <XCircle className="w-4 h-4 text-[var(--color-danger)]" />
                <span className="text-[var(--color-danger)] font-medium">
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
        <div className="glass-card p-6 border border-[var(--color-border-subtle)]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[var(--color-accent)]" />
              Contribution Graph
            </h3>
            <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
              Less
              <div className="flex gap-1">
                {[0, 20, 40, 60, 80, 100].map((o) => (
                  <div
                    key={o}
                    className="w-3 h-3 rounded-[2px]"
                    style={{
                      background: o === 0
                        ? "var(--color-surface-elevated)"
                        : `hsl(172, 85%, 45%, ${o / 100})`,
                    }}
                  />
                ))}
              </div>
              More
            </div>
          </div>
          <Heatmap data={heatmapData} />
        </div>
      )}

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Syncs */}
        <div className="glass-card flex flex-col">
          <div className="p-5 border-b border-[var(--color-border-subtle)] flex items-center justify-between">
            <h3 className="font-semibold text-[var(--color-text-primary)]">Recent Syncs</h3>
            <Link href="/dashboard/activity" className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
              View all
            </Link>
          </div>
          <div className="p-5 flex-1">
            {recentSubmissions.length > 0 ? (
              <div className="space-y-3">
                {recentSubmissions.map((sub, i) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between group py-1 border-b border-[var(--color-border-subtle)] last:border-0"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                          {sub.questionId}. {sub.problemTitle}
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                          {formatDistanceToNow(new Date(sub.syncedAt), { addSuffix: true })}
                          {sub.runtime && ` · ${sub.runtime}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {sub.difficulty && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${difficultyColor(sub.difficulty)}`}>
                          {sub.difficulty}
                        </span>
                      )}
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] font-medium hidden sm:block">
                        {sub.language}
                      </span>
                      {sub.commitUrl && (
                        <a
                          href={sub.commitUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Github className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-8">
                <RefreshCw className="w-8 h-8 text-[var(--color-text-muted)]/50 mb-3" />
                <p className="text-sm text-[var(--color-text-secondary)]">No submissions synced yet.</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                  {needsSetup ? "Complete setup to begin." : "Solve a problem on LeetCode to see it here."}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sync Status */}
        <div className="glass-card flex flex-col">
          <div className="p-5 border-b border-[var(--color-border-subtle)]">
            <h3 className="font-semibold text-[var(--color-text-primary)]">Sync Engine Status</h3>
          </div>
          <div className="p-5 flex-1 flex flex-col justify-center">
            {lastSync ? (
              <div className="space-y-3.5">
                {[
                  ["Last Run", formatDistanceToNow(new Date(lastSync.runAt), { addSuffix: true })],
                  ["New Commits", String(lastSync.newSubmissionsCount)],
                  ["Duration", `${lastSync.durationMs}ms`],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-sm text-[var(--color-text-muted)]">{label}</span>
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">{value}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--color-text-muted)]">Status</span>
                  <span
                    className={`text-sm font-medium px-2.5 py-0.5 rounded-full ${
                      lastSync.status === "SUCCESS" || lastSync.status === "NO_NEW"
                        ? "bg-[var(--color-success-subtle)] text-[var(--color-success)]"
                        : lastSync.status === "PARTIAL"
                        ? "bg-[var(--color-warning-subtle)] text-[var(--color-warning)]"
                        : "bg-[var(--color-danger-subtle)] text-[var(--color-danger)]"
                    }`}
                  >
                    {lastSync.status}
                  </span>
                </div>
                {lastSync.errorMessage && (
                  <div className="mt-2 p-3 rounded-[var(--radius-md)] bg-[var(--color-danger-subtle)] border border-[var(--color-danger)]/20 text-xs text-[var(--color-danger)] break-words">
                    {lastSync.errorMessage}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center">
                <div className="w-2 h-2 rounded-full bg-[var(--color-success)] animate-pulse-dot mx-auto mb-3" />
                <p className="text-sm text-[var(--color-text-primary)] font-medium">Engine is active</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">Waiting for first sync run.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
