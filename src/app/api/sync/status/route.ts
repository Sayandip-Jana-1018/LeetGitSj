import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * GET /api/sync/status
 * Returns the current sync status for the dashboard status card.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const [
    leetcodeCredential,
    githubInstallation,
    lastSync,
    totalSynced,
    recentSubmissions,
  ] = await Promise.all([
    prisma.leetCodeCredential.findUnique({
      where: { userId },
      select: {
        status: true,
        leetcodeUsername: true,
        lastVerifiedAt: true,
      },
    }),
    prisma.gitHubInstallation.findUnique({
      where: { userId },
      select: {
        repoFullName: true,
        isActive: true,
        folderPattern: true,
        commitMessageTemplate: true,
      },
    }),
    prisma.syncLog.findFirst({
      where: { userId },
      orderBy: { runAt: "desc" },
    }),
    prisma.syncedSubmission.count({ where: { userId } }),
    prisma.syncedSubmission.findMany({
      where: { userId },
      orderBy: { syncedAt: "desc" },
      take: 10,
    }),
  ]);

  let streak = 0;
  if (totalSynced > 0) {
    const allSubmissions = await prisma.syncedSubmission.findMany({
      where: { userId },
      select: { syncedAt: true },
      orderBy: { syncedAt: "desc" },
    });

    const submissionDays = [
      ...new Set(
        allSubmissions.map((s) =>
          new Date(s.syncedAt).toISOString().split("T")[0]
        )
      ),
    ].sort((a, b) => b.localeCompare(a));

    if (submissionDays.length > 0) {
      const today = new Date().toISOString().split("T")[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

      if (submissionDays[0] === today || submissionDays[0] === yesterday) {
        streak = 1;
        for (let i = 1; i < submissionDays.length; i++) {
          const prev = new Date(submissionDays[i - 1]);
          const curr = new Date(submissionDays[i]);
          const diff = (prev.getTime() - curr.getTime()) / 86400000;
          if (diff === 1) streak++;
          else break;
        }
      }
    }
  }

  // Language breakdown
  const languageBreakdown = await prisma.syncedSubmission.groupBy({
    by: ["language"],
    where: { userId },
    _count: { language: true },
    orderBy: { _count: { language: "desc" } },
    take: 10,
  });

  return NextResponse.json({
    leetcode: leetcodeCredential
      ? {
          connected: true,
          status: leetcodeCredential.status,
          username: leetcodeCredential.leetcodeUsername,
          lastVerifiedAt: leetcodeCredential.lastVerifiedAt,
        }
      : { connected: false },
    github: githubInstallation
      ? {
          connected: true,
          repoFullName: githubInstallation.repoFullName,
          isActive: githubInstallation.isActive,
          folderPattern: githubInstallation.folderPattern,
          commitMessageTemplate: githubInstallation.commitMessageTemplate,
        }
      : { connected: false },
    lastSync: lastSync
      ? {
          runAt: lastSync.runAt,
          status: lastSync.status,
          newSubmissionsCount: lastSync.newSubmissionsCount,
          errorMessage: lastSync.errorMessage,
        }
      : null,
    stats: {
      totalSynced,
      streak,
      languageBreakdown: languageBreakdown.map((l) => ({
        language: l.language,
        count: l._count.language,
      })),
    },
    recentSubmissions,
  });
}
