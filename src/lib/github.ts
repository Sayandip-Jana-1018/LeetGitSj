import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";
import crypto from "crypto";

// ============================================================
// GitHub App Authentication & API Utilities
// ============================================================

// Cache installation tokens (they last 1 hour, we cache for 55 min)
const tokenCache = new Map<number, { token: string; expiresAt: number }>();
const TOKEN_TTL_MS = 55 * 60 * 1000; // 55 minutes

function getAppCredentials() {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;

  if (!appId || !privateKey) {
    throw new Error("GITHUB_APP_ID and GITHUB_APP_PRIVATE_KEY must be set");
  }

  return {
    appId: parseInt(appId, 10),
    // Handle newline-escaped PEM keys from env vars
    privateKey: privateKey.replace(/\\n/g, "\n"),
  };
}

/**
 * Get an installation access token for a GitHub App installation.
 * Tokens are cached for 55 minutes (they expire after 60).
 */
export async function getInstallationToken(
  installationId: number
): Promise<string> {
  const cached = tokenCache.get(installationId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.token;
  }

  const { appId, privateKey } = getAppCredentials();

  const auth = createAppAuth({
    appId,
    privateKey,
    installationId,
  });

  const { token } = await auth({ type: "installation" });

  tokenCache.set(installationId, {
    token,
    expiresAt: Date.now() + TOKEN_TTL_MS,
  });

  return token;
}

/**
 * Get an authenticated Octokit instance for a specific installation.
 */
export async function getInstallationOctokit(
  installationId: number
): Promise<Octokit> {
  const token = await getInstallationToken(installationId);
  return new Octokit({ auth: token });
}

/**
 * List repositories accessible to a GitHub App installation.
 */
export async function listInstallationRepos(
  installationId: number
): Promise<
  Array<{
    id: number;
    name: string;
    full_name: string;
    private: boolean;
    default_branch: string;
  }>
> {
  const octokit = await getInstallationOctokit(installationId);

  const { data } = await octokit.apps.listReposAccessibleToInstallation({
    per_page: 100,
  });

  return data.repositories.map((repo) => ({
    id: repo.id,
    name: repo.name,
    full_name: repo.full_name,
    private: repo.private,
    default_branch: repo.default_branch,
  }));
}

/**
 * Commit a file to a repository via the GitHub Contents API.
 * Creates the file if it doesn't exist, updates it if it does.
 *
 * Returns the commit SHA and URL on success.
 */
export async function commitFile(
  installationId: number,
  repoFullName: string,
  filePath: string,
  content: string,
  commitMessage: string
): Promise<{ sha: string; commitUrl: string }> {
  const octokit = await getInstallationOctokit(installationId);
  const [owner, repo] = repoFullName.split("/");

  // Check if file already exists (need its SHA to update)
  let existingSha: string | undefined;
  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path: filePath,
    });

    if (!Array.isArray(data) && data.type === "file") {
      existingSha = data.sha;
    }
  } catch (err: unknown) {
    // 404 means file doesn't exist — that's fine, we'll create it
    const error = err as { status?: number };
    if (error.status !== 404) {
      throw err;
    }
  }

  // Base64 encode the content
  const encodedContent = Buffer.from(content, "utf-8").toString("base64");

  const params: Parameters<typeof octokit.repos.createOrUpdateFileContents>[0] =
    {
      owner,
      repo,
      path: filePath,
      message: commitMessage,
      content: encodedContent,
      ...(existingSha ? { sha: existingSha } : {}),
    };

  const { data } = await octokit.repos.createOrUpdateFileContents(params);

  return {
    sha: data.commit.sha ?? "",
    commitUrl: data.commit.html_url ?? "",
  };
}

/**
 * Verify a GitHub App webhook signature.
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  const secret = process.env.GITHUB_APP_WEBHOOK_SECRET;

  if (!secret) {
    throw new Error("GITHUB_APP_WEBHOOK_SECRET is not set");
  }

  const expected = `sha256=${crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex")}`;

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
