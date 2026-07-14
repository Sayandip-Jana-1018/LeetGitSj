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

  // Calculate streak (consecutive days with syncs)
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
        // Allow today to not have syncs yet
        break;
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
