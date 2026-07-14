import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle2, XCircle, AlertCircle, RefreshCw } from "lucide-react";
import { Github } from "@/components/icons/github";
import Link from "next/link";
import { Heatmap } from "@/components/dashboard/Heatmap";
import { SyncTriggerButton } from "@/components/dashboard/SyncTriggerButton";

export const dynamic = "force-dynamic";

export default async function DashboardOverview() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  // Fetch all necessary data
  const [
    leetcodeCredential,
    githubInstallation,
    lastSync,
    totalSynced,
    recentSubmissions,
  ] = await Promise.all([
    prisma.leetCodeCredential.findUnique({ where: { userId } }),
    prisma.gitHubInstallation.findUnique({ where: { userId } }),
    prisma.syncLog.findFirst({
      where: { userId },
      orderBy: { runAt: "desc" },
    }),
    prisma.syncedSubmission.count({ where: { userId } }),
    prisma.syncedSubmission.findMany({
      where: { userId },
      orderBy: { syncedAt: "desc" },
      take: 5,
    }),
  ]);

  // If missing connections, show onboarding alert
  const needsSetup = !leetcodeCredential || !githubInstallation;

  // Calculate streak
  let streak = 0;
  if (totalSynced > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 365; i++) {
      const dayStart = new Date(today);
      dayStart.setDate(dayStart.getDate() - i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const count = await prisma.syncedSubmission.count({
        where: {
          userId,
          syncedAt: { gte: dayStart, lt: dayEnd },
        },
      });

      if (count > 0) {
        streak++;
      } else if (i > 0) {
        break; // Only break if not today
      }
    }
  }

  // Fetch heatmap data for the last 365 days
  const oneYearAgo = new Date();
  oneYearAgo.setDate(oneYearAgo.getDate() - 365);
  
  const heatmapRaw = await prisma.syncedSubmission.groupBy({
    by: ["syncedAt"],
    where: {
      userId,
      syncedAt: { gte: oneYearAgo },
    },
    _count: { _all: true },
  });
  
  const heatmapData = heatmapRaw.map(h => ({
    date: h.syncedAt,
    count: h._count._all,
  }));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Overview
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Your LeetCode to GitHub sync status and activity.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SyncTriggerButton disabled={needsSetup} />
        </div>
      </div>

      {needsSetup && (
        <div className="rounded-[var(--radius-lg)] bg-[var(--color-warning-subtle)] border border-[var(--color-warning)]/30 p-5 flex items-start gap-4">
          <AlertCircle className="w-5 h-5 text-[var(--color-warning)] mt-0.5 shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
              Action Required: Complete Setup
            </h3>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              You need to connect both GitHub and LeetCode before syncing can begin.
            </p>
            <div className="mt-4 flex gap-3">
              <Link
                href="/dashboard/settings"
                className="text-sm font-medium text-[var(--color-accent)] hover:underline"
              >
                Go to Settings &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Synced */}
        <div className="glass-card p-5">
          <p className="text-sm font-medium text-[var(--color-text-muted)]">Total Synced</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[var(--color-text-primary)]">{totalSynced}</span>
            <span className="text-sm text-[var(--color-text-muted)]">submissions</span>
          </div>
        </div>

        {/* Current Streak */}
        <div className="glass-card p-5">
          <p className="text-sm font-medium text-[var(--color-text-muted)]">Current Streak</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[var(--color-success)]">{streak}</span>
            <span className="text-sm text-[var(--color-text-muted)]">days</span>
          </div>
        </div>

        {/* GitHub Connection */}
        <div className="glass-card p-5 flex flex-col justify-between">
          <p className="text-sm font-medium text-[var(--color-text-muted)] mb-3">GitHub Integration</p>
          {githubInstallation?.isActive ? (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-[var(--color-success)]" />
              <span className="text-[var(--color-text-primary)] truncate" title={githubInstallation.repoFullName}>
                {githubInstallation.repoFullName}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm">
              <XCircle className="w-4 h-4 text-[var(--color-danger)]" />
              <span className="text-[var(--color-text-muted)]">Not connected</span>
            </div>
          )}
        </div>

        {/* LeetCode Connection */}
        <div className="glass-card p-5 flex flex-col justify-between">
          <p className="text-sm font-medium text-[var(--color-text-muted)] mb-3">LeetCode Session</p>
          {leetcodeCredential?.status === "ACTIVE" ? (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-[var(--color-success)]" />
              <span className="text-[var(--color-text-primary)] truncate" title={leetcodeCredential.leetcodeUsername ?? undefined}>
                {leetcodeCredential.leetcodeUsername}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm">
              <XCircle className="w-4 h-4 text-[var(--color-danger)]" />
              <span className="text-[var(--color-danger)] font-medium">Expired / Missing</span>
            </div>
          )}
        </div>
      </div>

      {/* Heatmap */}
      {!needsSetup && (
        <div className="glass-card p-6 border border-[var(--color-border-subtle)]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
              Contribution Graph
            </h3>
            <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
              Less
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-[2px] bg-[var(--color-surface-elevated)]" />
                <div className="w-3 h-3 rounded-[2px] bg-[var(--color-accent)] opacity-20" />
                <div className="w-3 h-3 rounded-[2px] bg-[var(--color-accent)] opacity-40" />
                <div className="w-3 h-3 rounded-[2px] bg-[var(--color-accent)] opacity-60" />
                <div className="w-3 h-3 rounded-[2px] bg-[var(--color-accent)] opacity-80" />
                <div className="w-3 h-3 rounded-[2px] bg-[var(--color-accent)]" />
              </div>
              More
            </div>
          </div>
          <Heatmap data={heatmapData} />
        </div>
      )}

      {/* Split bottom area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Submissions */}
        <div className="glass-card flex flex-col">
          <div className="p-5 border-b border-[var(--color-border-subtle)] flex items-center justify-between">
            <h3 className="font-semibold text-[var(--color-text-primary)]">Recent Syncs</h3>
            <Link href="/dashboard/activity" className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
              View all
            </Link>
          </div>
          <div className="p-5 flex-1">
            {recentSubmissions.length > 0 ? (
              <div className="space-y-4">
                {recentSubmissions.map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-[var(--color-success)]" />
                      <div>
                        <p className="text-sm font-medium text-[var(--color-text-primary)]">
                          {sub.questionId}. {sub.problemTitle}
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                          {formatDistanceToNow(new Date(sub.syncedAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] px-2 py-0.5 rounded-[var(--radius-full)] bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] font-medium">
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
                {needsSetup ? (
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">Complete setup to begin.</p>
                ) : (
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">Solve a problem on LeetCode to see it here.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sync Log (Status) */}
        <div className="glass-card flex flex-col">
          <div className="p-5 border-b border-[var(--color-border-subtle)]">
            <h3 className="font-semibold text-[var(--color-text-primary)]">Sync Engine Status</h3>
          </div>
          <div className="p-5 flex-1 flex flex-col justify-center">
            {lastSync ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--color-text-muted)]">Last Run</span>
                  <span className="text-sm font-medium text-[var(--color-text-primary)]">
                    {formatDistanceToNow(new Date(lastSync.runAt), { addSuffix: true })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--color-text-muted)]">Status</span>
                  <span
                    className={`text-sm font-medium px-2.5 py-0.5 rounded-[var(--radius-full)] ${
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
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--color-text-muted)]">New Submissions</span>
                  <span className="text-sm font-medium text-[var(--color-text-primary)]">
                    {lastSync.newSubmissionsCount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--color-text-muted)]">Duration</span>
                  <span className="text-sm text-[var(--color-text-primary)]">
                    {lastSync.durationMs}ms
                  </span>
                </div>
                {lastSync.errorMessage && (
                  <div className="mt-4 p-3 rounded-[var(--radius-md)] bg-[var(--color-danger-subtle)] border border-[var(--color-danger)]/20 text-xs text-[var(--color-danger)] break-words">
                    Error: {lastSync.errorMessage}
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
