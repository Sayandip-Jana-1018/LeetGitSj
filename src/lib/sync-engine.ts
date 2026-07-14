import { prisma } from "./prisma";
import { decrypt } from "./encryption";
import { commitFile } from "./github";
import {
  fetchRecentSubmissions,
  fetchSubmissionDetail,
  getFileExtension,
  LeetCodeAuthError,
  LeetCodeRateLimitError,
} from "./leetcode";
import { interpolate, sleep } from "./utils";

// ============================================================
// Sync Engine — Core Business Logic
// ============================================================

/**
 * How many consecutive already-synced submissions to see
 * before stopping (we've "caught up").
 */
const EARLY_STOP_THRESHOLD = 5;

/**
 * Max submissions to process in a single sync run.
 * Prevents runaway first-time backfills from hogging resources.
 */
const MAX_SUBMISSIONS_PER_RUN = 50;

/**
 * Page size for fetching submissions from LeetCode.
 */
const PAGE_SIZE = 20;

export interface SyncResult {
  status: "success" | "partial" | "failure" | "no_new";
  newSubmissionsCount: number;
  errorMessage?: string;
  durationMs: number;
}

/**
 * Synchronize a user's LeetCode submissions to their GitHub repo.
 *
 * This is the heart of the product — called by both the manual
 * "Sync now" flow (via BullMQ job) and the automated scheduler.
 *
 * Algorithm:
 * 1. Load & decrypt credentials
 * 2. Fetch submissions newest-first from LeetCode
 * 3. Skip non-Accepted, diff against SyncedSubmission by LC submission ID
 * 4. Early-stop once we hit EARLY_STOP_THRESHOLD consecutive already-synced
 * 5. For each new Accepted: fetch code → commit to GitHub → record
 * 6. Log the run
 */
export async function syncUserSubmissions(
  userId: string
): Promise<SyncResult> {
  const startTime = Date.now();

  // 1. Load user's credential and installation
  const [credential, installation] = await Promise.all([
    prisma.leetCodeCredential.findUnique({ where: { userId } }),
    prisma.gitHubInstallation.findUnique({ where: { userId } }),
  ]);

  if (!credential || credential.status !== "ACTIVE") {
    return logAndReturn(userId, {
      status: "failure",
      newSubmissionsCount: 0,
      errorMessage: "No active LeetCode credential found",
      durationMs: Date.now() - startTime,
    });
  }

  if (!installation || !installation.isActive) {
    return logAndReturn(userId, {
      status: "failure",
      newSubmissionsCount: 0,
      errorMessage: "No active GitHub installation found",
      durationMs: Date.now() - startTime,
    });
  }

  // 2. Decrypt credentials in-memory
  let session: string;
  let csrfToken: string;
  try {
    session = decrypt(credential.encryptedSession);
    csrfToken = decrypt(credential.encryptedCsrfToken);
  } catch {
    return logAndReturn(userId, {
      status: "failure",
      newSubmissionsCount: 0,
      errorMessage: "Failed to decrypt LeetCode credentials",
      durationMs: Date.now() - startTime,
    });
  }

  // 3. Walk submissions newest-first
  let offset = 0;
  let consecutiveAlreadySynced = 0;
  let newCount = 0;
  let lastError: string | undefined;

  try {
    outer: while (newCount < MAX_SUBMISSIONS_PER_RUN) {
      const { submissions, hasMore } = await fetchRecentSubmissions(
        session,
        csrfToken,
        PAGE_SIZE,
        offset
      );

      if (submissions.length === 0) break;

      for (const sub of submissions) {
        if (newCount >= MAX_SUBMISSIONS_PER_RUN) break outer;

        // Skip non-Accepted submissions
        if (sub.statusDisplay !== "Accepted") {
          continue;
        }

        // Check if already synced
        const existing = await prisma.syncedSubmission.findUnique({
          where: { leetcodeSubmissionId: sub.id },
        });

        if (existing) {
          consecutiveAlreadySynced++;
          if (consecutiveAlreadySynced >= EARLY_STOP_THRESHOLD) {
            break outer; // We've caught up — stop walking
          }
          continue;
        }

        // Reset counter — found a new one
        consecutiveAlreadySynced = 0;

        // 4. Fetch full submission detail (source code)
        try {
          const detail = await fetchSubmissionDetail(
            session,
            csrfToken,
            sub.id
          );

          // 5. Build file path and commit message
          const ext = getFileExtension(detail.lang);
          const templateVars: Record<string, string> = {
            questionId: detail.question.questionId,
            titleSlug: detail.question.titleSlug,
            title: detail.question.title,
            lang: detail.lang,
            ext,
          };

          const filePath = interpolate(
            installation.folderPattern,
            templateVars
          );
          const commitMessage = interpolate(
            installation.commitMessageTemplate,
            templateVars
          );

          // 6. Commit to GitHub
          const { sha, commitUrl } = await commitFile(
            installation.installationId,
            installation.repoFullName,
            filePath,
            detail.code,
            commitMessage
          );

          // 7. Record the synced submission
          await prisma.syncedSubmission.create({
            data: {
              userId,
              leetcodeSubmissionId: sub.id,
              problemSlug: detail.question.titleSlug,
              problemTitle: detail.question.title,
              questionId: detail.question.questionId,
              language: detail.lang,
              runtime: detail.runtime,
              memory: detail.memory,
              commitSha: sha,
              commitUrl: commitUrl,
            },
          });

          newCount++;
        } catch (err) {
          // If it's a single submission failure, log and continue with others
          if (
            err instanceof LeetCodeAuthError ||
            err instanceof LeetCodeRateLimitError
          ) {
            throw err; // These are fatal — bubble up
          }
          lastError = `Failed to sync submission ${sub.id}: ${err instanceof Error ? err.message : String(err)}`;
          console.error(lastError);
        }

        // Small delay between GitHub commits to be respectful
        await sleep(500);
      }

      if (!hasMore) break;
      offset += PAGE_SIZE;
    }
  } catch (err) {
    if (err instanceof LeetCodeAuthError) {
      // Mark credential as expired
      await prisma.leetCodeCredential.update({
        where: { userId },
        data: { status: "EXPIRED" },
      });

      return logAndReturn(userId, {
        status: "failure",
        newSubmissionsCount: newCount,
        errorMessage: `LeetCode session expired: ${err.message}`,
        durationMs: Date.now() - startTime,
      });
    }

    if (err instanceof LeetCodeRateLimitError) {
      return logAndReturn(userId, {
        status: newCount > 0 ? "partial" : "failure",
        newSubmissionsCount: newCount,
        errorMessage: `Rate limited by LeetCode after syncing ${newCount} submissions`,
        durationMs: Date.now() - startTime,
      });
    }

    return logAndReturn(userId, {
      status: newCount > 0 ? "partial" : "failure",
      newSubmissionsCount: newCount,
      errorMessage: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - startTime,
    });
  }

  // Determine final status
  const status =
    newCount === 0
      ? "no_new"
      : lastError
        ? "partial"
        : "success";

  return logAndReturn(userId, {
    status,
    newSubmissionsCount: newCount,
    errorMessage: lastError,
    durationMs: Date.now() - startTime,
  });
}

/**
 * Log the sync run to the database and return the result.
 */
async function logAndReturn(
  userId: string,
  result: SyncResult
): Promise<SyncResult> {
  const statusMap = {
    success: "SUCCESS" as const,
    partial: "PARTIAL" as const,
    failure: "FAILURE" as const,
    no_new: "NO_NEW" as const,
  };

  try {
    await prisma.syncLog.create({
      data: {
        userId,
        status: statusMap[result.status],
        newSubmissionsCount: result.newSubmissionsCount,
        errorMessage: result.errorMessage,
        durationMs: result.durationMs,
      },
    });
  } catch (err) {
    // Don't let logging failure prevent the sync result from returning
    console.error("Failed to write SyncLog:", err);
  }

  return result;
}
