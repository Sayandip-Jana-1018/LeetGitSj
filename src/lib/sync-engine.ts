import { prisma } from "./prisma";
import { decrypt } from "./encryption";
import { commitSolutionFolder } from "./github";
import {
  fetchRecentSubmissions,
  fetchSubmissionDetail,
  fetchProblemMeta,
  getFileExtension,
  LeetCodeAuthError,
  LeetCodeRateLimitError,
} from "./leetcode";
import { setExpiredFlag } from "./queue";
import { generateReadme } from "./readme-gen";
import { sendExpiryNotification } from "./notifications";
import { slugify, sleep } from "./utils";

// ============================================================
// Sync Engine — Core Business Logic (Phase 6)
// ============================================================

const EARLY_STOP_THRESHOLD = 5;
const MAX_SUBMISSIONS_PER_RUN = 50;
const PAGE_SIZE = 20;

export interface SyncResult {
  status: "success" | "partial" | "failure" | "no_new";
  newSubmissionsCount: number;
  errorMessage?: string;
  durationMs: number;
}

/**
 * Build the canonical folder path for a submission.
 * Format: {questionId}-{slug}
 * e.g. "1-two-sum" or "42-trapping-rain-water"
 */
function buildFolderPath(questionId: string, titleSlug: string): string {
  return `${questionId}-${slugify(titleSlug)}`;
}

export async function syncUserSubmissions(userId: string): Promise<SyncResult> {
  const startTime = Date.now();

  const [credential, installation, user] = await Promise.all([
    prisma.leetCodeCredential.findUnique({ where: { userId } }),
    prisma.gitHubInstallation.findUnique({ where: { userId } }),
    prisma.user.findUnique({ where: { id: userId } })
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

  // Decrypt credentials in-memory — never logged, never returned to any response
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

  let offset = 0;
  let consecutiveAlreadySynced = 0;
  let newCount = 0;
  let lastError: string | undefined;

  try {
    outer: while (newCount < MAX_SUBMISSIONS_PER_RUN) {
      const { submissions, hasMore } = await fetchRecentSubmissions(
        session, csrfToken, PAGE_SIZE, offset
      );

      if (submissions.length === 0) break;

      for (const sub of submissions) {
        if (newCount >= MAX_SUBMISSIONS_PER_RUN) break outer;

        if (sub.statusDisplay !== "Accepted") continue;

        const existing = await prisma.syncedSubmission.findUnique({
          where: { leetcodeSubmissionId: sub.id },
        });

        if (existing) {
          consecutiveAlreadySynced++;
          if (consecutiveAlreadySynced >= EARLY_STOP_THRESHOLD) break outer;
          continue;
        }

        consecutiveAlreadySynced = 0;

        try {
          // Fetch full submission details (code, runtime, memory)
          const detail = await fetchSubmissionDetail(session, csrfToken, sub.id);
          const ext = getFileExtension(detail.lang);

          // Fetch problem metadata (difficulty, tags, percentiles)
          const meta = await fetchProblemMeta(session, csrfToken, detail.question.titleSlug);

          // Build folder path with normalized slug — no spaces, no special chars
          const folderPath = buildFolderPath(detail.question.questionId, detail.question.titleSlug);
          const solutionFileName = `solution.${ext}`;

          // Generate README (AI-assisted with fallback)
          const readme = await generateReadme({
            questionId: detail.question.questionId,
            title: detail.question.title,
            titleSlug: detail.question.titleSlug,
            difficulty: meta.difficulty,
            tags: meta.tags,
            code: detail.code,
            lang: detail.lang,
            runtime: detail.runtime,
            memory: detail.memory,
            runtimePercentile: meta.runtimePercentile,
            memoryPercentile: meta.memoryPercentile,
            submissionId: sub.id,
          });

          // Build commit message from template
          const commitMessage = installation.commitMessageTemplate
            .replace("{questionId}", detail.question.questionId)
            .replace("{titleSlug}", detail.question.titleSlug)
            .replace("{title}", detail.question.title)
            .replace("{lang}", detail.lang)
            .replace("{difficulty}", meta.difficulty);

          // Atomic commit: solution + README land in one Git commit
          const { sha, commitUrl } = await commitSolutionFolder(
            installation.installationId,
            installation.repoFullName,
            [
              { path: `${folderPath}/${solutionFileName}`, content: detail.code },
              { path: `${folderPath}/README.md`, content: readme.content },
            ],
            commitMessage,
            installation.defaultBranch || "main",
            user?.name || undefined,
            user?.email || undefined
          );

          // Record to database
          await prisma.syncedSubmission.create({
            data: {
              userId,
              leetcodeSubmissionId: sub.id,
              problemSlug: detail.question.titleSlug,
              problemTitle: detail.question.title,
              questionId: detail.question.questionId,
              language: detail.lang,
              difficulty: meta.difficulty,
              tags: meta.tags,
              runtime: detail.runtime,
              memory: detail.memory,
              runtimePercentile: meta.runtimePercentile,
              memoryPercentile: meta.memoryPercentile,
              commitSha: sha,
              commitUrl: commitUrl,
            },
          });

          newCount++;
        } catch (err) {
          if (err instanceof LeetCodeAuthError || err instanceof LeetCodeRateLimitError) {
            throw err; // Fatal — bubble up
          }
          lastError = `Failed to sync submission ${sub.id}: ${err instanceof Error ? err.message : String(err)}`;
          console.error(lastError);
        }

        await sleep(500); // respectful pacing between commits
      }

      if (!hasMore) break;
      offset += PAGE_SIZE;
    }
  } catch (err) {
    if (err instanceof LeetCodeAuthError) {
      // Mark as expired and fire exactly one notification
      await prisma.leetCodeCredential.update({
        where: { userId },
        data: { status: "EXPIRED" },
      });

      // Backoff in Redis for 23h to prevent hammering
      await setExpiredFlag(userId);

      // Fire notification (will skip if already notified for this cycle)
      await sendExpiryNotification(userId);

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

  const status = newCount === 0 ? "no_new" : lastError ? "partial" : "success";
  return logAndReturn(userId, {
    status,
    newSubmissionsCount: newCount,
    errorMessage: lastError,
    durationMs: Date.now() - startTime,
  });
}

async function logAndReturn(userId: string, result: SyncResult): Promise<SyncResult> {
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
    console.error("Failed to write SyncLog:", err);
  }

  return result;
}
