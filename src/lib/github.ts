/**
 * GitHub Git Data API — Atomic Multi-File Commits
 *
 * Replaces sequential Contents API calls with the Git Data API tree flow:
 * blobs → tree → commit → ref update.
 *
 * This ensures solution.{ext} + README.md land in a SINGLE atomic commit.
 */

import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";
import crypto from "crypto";

// ============================================================
// Token Cache
// ============================================================

const tokenCache = new Map<number, { token: string; expiresAt: number }>();
const TOKEN_TTL_MS = 55 * 60 * 1000;

function getAppCredentials() {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;
  if (!appId || !privateKey) throw new Error("GITHUB_APP_ID and GITHUB_APP_PRIVATE_KEY must be set");
  return { appId: parseInt(appId, 10), privateKey: privateKey.replace(/\\n/g, "\n") };
}

export async function getInstallationToken(installationId: number): Promise<string> {
  const cached = tokenCache.get(installationId);
  if (cached && cached.expiresAt > Date.now()) return cached.token;

  const { appId, privateKey } = getAppCredentials();
  const auth = createAppAuth({ appId, privateKey, installationId });
  const { token } = await auth({ type: "installation" });

  tokenCache.set(installationId, { token, expiresAt: Date.now() + TOKEN_TTL_MS });
  return token;
}

export async function getInstallationOctokit(installationId: number): Promise<Octokit> {
  const token = await getInstallationToken(installationId);
  return new Octokit({ auth: token });
}

export async function listInstallationRepos(installationId: number): Promise<
  Array<{ id: number; name: string; full_name: string; private: boolean; default_branch: string }>
> {
  const octokit = await getInstallationOctokit(installationId);
  const { data } = await octokit.apps.listReposAccessibleToInstallation({ per_page: 100 });
  return data.repositories.map((repo) => ({
    id: repo.id,
    name: repo.name,
    full_name: repo.full_name,
    private: repo.private,
    default_branch: repo.default_branch,
  }));
}

// ============================================================
// Atomic Multi-File Commit via Git Data API
// ============================================================

export interface FileToCommit {
  path: string;      // e.g. "1-two-sum/solution.py"
  content: string;   // raw UTF-8 content
}

export interface CommitResult {
  sha: string;
  commitUrl: string;
}

/**
 * Commit multiple files atomically in a single Git commit.
 * 
 * Flow:
 * 1. Get current branch HEAD SHA
 * 2. Get current tree SHA from that commit
 * 3. Create blobs for each file
 * 4. Create a new tree with all blobs
 * 5. Create a commit pointing to the new tree
 * 6. Update branch ref to the new commit
 */
export async function commitSolutionFolder(
  installationId: number,
  repoFullName: string,
  files: FileToCommit[],
  commitMessage: string,
  defaultBranch = "main"
): Promise<CommitResult> {
  const octokit = await getInstallationOctokit(installationId);
  const [owner, repo] = repoFullName.split("/");

  // 1. Get the current branch ref
  let baseSha: string;
  let baseTreeSha: string;
  try {
    const { data: refData } = await octokit.git.getRef({
      owner, repo, ref: `heads/${defaultBranch}`,
    });
    baseSha = refData.object.sha;

    const { data: commitData } = await octokit.git.getCommit({
      owner, repo, commit_sha: baseSha,
    });
    baseTreeSha = commitData.tree.sha;
  } catch (err: any) {
    // If repo is completely empty, we need to create an initial commit
    if (err?.status === 409 || err?.status === 404) {
      return commitSolutionFolderToEmpty(octokit, owner, repo, files, commitMessage, defaultBranch);
    }
    throw err;
  }

  // 2. Create blobs for each file
  const treeItems = await Promise.all(
    files.map(async (file) => {
      const { data: blob } = await octokit.git.createBlob({
        owner,
        repo,
        content: Buffer.from(file.content, "utf-8").toString("base64"),
        encoding: "base64",
      });
      return {
        path: file.path,
        mode: "100644" as const,
        type: "blob" as const,
        sha: blob.sha,
      };
    })
  );

  // 3. Create a new tree
  const { data: newTree } = await octokit.git.createTree({
    owner, repo,
    base_tree: baseTreeSha,
    tree: treeItems,
  });

  // 4. Create the commit
  const { data: newCommit } = await octokit.git.createCommit({
    owner, repo,
    message: commitMessage,
    tree: newTree.sha,
    parents: [baseSha],
  });

  // 5. Update the branch ref
  await octokit.git.updateRef({
    owner, repo,
    ref: `heads/${defaultBranch}`,
    sha: newCommit.sha,
  });

  return {
    sha: newCommit.sha,
    commitUrl: newCommit.html_url || `https://github.com/${repoFullName}/commit/${newCommit.sha}`,
  };
}

// Handle first commit to an empty repo
async function commitSolutionFolderToEmpty(
  octokit: Octokit,
  owner: string,
  repo: string,
  files: FileToCommit[],
  commitMessage: string,
  branch: string
): Promise<CommitResult> {
  // Create blobs
  const treeItems = await Promise.all(
    files.map(async (file) => {
      const { data: blob } = await octokit.git.createBlob({
        owner, repo,
        content: Buffer.from(file.content, "utf-8").toString("base64"),
        encoding: "base64",
      });
      return { path: file.path, mode: "100644" as const, type: "blob" as const, sha: blob.sha };
    })
  );

  const { data: newTree } = await octokit.git.createTree({ owner, repo, tree: treeItems });
  const { data: newCommit } = await octokit.git.createCommit({
    owner, repo, message: commitMessage, tree: newTree.sha, parents: [],
  });

  // Create or update branch ref
  try {
    await octokit.git.createRef({ owner, repo, ref: `refs/heads/${branch}`, sha: newCommit.sha });
  } catch {
    await octokit.git.updateRef({ owner, repo, ref: `heads/${branch}`, sha: newCommit.sha, force: true });
  }

  return {
    sha: newCommit.sha,
    commitUrl: `https://github.com/${owner}/${repo}/commit/${newCommit.sha}`,
  };
}

// ============================================================
// Webhook signature verification
// ============================================================

export function verifyWebhookSignature(payload: string, signature: string): boolean {
  const secret = process.env.GITHUB_APP_WEBHOOK_SECRET;
  if (!secret) throw new Error("GITHUB_APP_WEBHOOK_SECRET is not set");

  const expected = `sha256=${crypto.createHmac("sha256", secret).update(payload).digest("hex")}`;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
