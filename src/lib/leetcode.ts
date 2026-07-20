import { sleep } from "./utils";

// ============================================================
// LeetCode GraphQL API Client
// ============================================================

const LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql";

// Rate limiting: minimum 2 seconds between requests
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL_MS = 2000;

/**
 * Language slug → file extension mapping.
 * Covers all languages LeetCode currently supports.
 */
export const LANG_TO_EXT: Record<string, string> = {
  python3: "py",
  python: "py",
  java: "java",
  cpp: "cpp",
  "c++": "cpp",
  c: "c",
  javascript: "js",
  typescript: "ts",
  golang: "go",
  go: "go",
  rust: "rs",
  csharp: "cs",
  "c#": "cs",
  kotlin: "kt",
  swift: "swift",
  ruby: "rb",
  scala: "scala",
  php: "php",
  dart: "dart",
  racket: "rkt",
  erlang: "erl",
  elixir: "ex",
  mysql: "sql",
  mssql: "sql",
  oraclesql: "sql",
  postgresql: "sql",
  pythondata: "py",
  react: "jsx",
  vanillajs: "js",
  bash: "sh",
};

/**
 * Normalize a language slug from LeetCode.
 * LeetCode sometimes returns "python3", "cpp", "golang" etc.
 */
export function getFileExtension(lang: string): string {
  const normalized = lang.toLowerCase().replace(/\s+/g, "");
  return LANG_TO_EXT[normalized] ?? "txt";
}

interface LeetCodeRequestOptions {
  session: string;
  csrfToken: string;
}

/**
 * Internal: make a rate-limited request to LeetCode's GraphQL API.
 */
async function leetcodeGraphQL(
  query: string,
  variables: Record<string, unknown>,
  credentials: LeetCodeRequestOptions
): Promise<unknown> {
  // Enforce rate limit
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_REQUEST_INTERVAL_MS) {
    await sleep(MIN_REQUEST_INTERVAL_MS - elapsed);
  }
  lastRequestTime = Date.now();

  const response = await fetch(LEETCODE_GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `LEETCODE_SESSION=${credentials.session}; csrftoken=${credentials.csrfToken}`,
      "x-csrftoken": credentials.csrfToken,
      Referer: "https://leetcode.com",
      Origin: "https://leetcode.com",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (response.status === 401 || response.status === 403) {
    throw new LeetCodeAuthError(
      `LeetCode returned ${response.status} — session likely expired`
    );
  }

  if (response.status === 429) {
    throw new LeetCodeRateLimitError("LeetCode rate limit hit (429)");
  }

  if (!response.ok) {
    throw new Error(
      `LeetCode GraphQL request failed: ${response.status} ${response.statusText}`
    );
  }

  const json = await response.json();

  if (json.errors) {
    // Check if any error indicates auth failure
    const authError = json.errors.find(
      (e: { message: string }) =>
        e.message.includes("sign in") ||
        e.message.includes("authentication") ||
        e.message.includes("unauthorized")
    );
    if (authError) {
      throw new LeetCodeAuthError(authError.message);
    }
    throw new Error(`LeetCode GraphQL errors: ${JSON.stringify(json.errors)}`);
  }

  return json.data;
}

// ============================================================
// Custom Error Classes
// ============================================================

export class LeetCodeAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LeetCodeAuthError";
  }
}

export class LeetCodeRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LeetCodeRateLimitError";
  }
}

// ============================================================
// Public API Methods
// ============================================================

export interface LeetCodeUserProfile {
  username: string;
  realName: string;
}

/**
 * Verify that LeetCode credentials are valid.
 * Returns the user's profile if valid, throws LeetCodeAuthError if not.
 */
export async function verifyCredentials(
  session: string,
  csrfToken: string
): Promise<LeetCodeUserProfile> {
  const query = `
    query globalData {
      userStatus {
        username
        realName
        isSignedIn
      }
    }
  `;

  const data = (await leetcodeGraphQL(query, {}, { session, csrfToken })) as {
    userStatus: {
      username: string;
      realName: string;
      isSignedIn: boolean;
    };
  };

  if (!data.userStatus?.isSignedIn || !data.userStatus?.username) {
    throw new LeetCodeAuthError(
      "LeetCode session is not signed in — credentials may be invalid or expired"
    );
  }

  return {
    username: data.userStatus.username,
    realName: data.userStatus.realName,
  };
}

export interface LeetCodeSubmission {
  id: string;
  title: string;
  titleSlug: string;
  timestamp: string; // Unix timestamp as string
  statusDisplay: string; // "Accepted", "Wrong Answer", etc.
  lang: string;
  runtime: string;
  memory: string;
  // questionId comes from the problem, fetched separately when needed
}

/**
 * Fetch recent submissions from LeetCode.
 * Returns newest-first, paginated.
 */
export async function fetchRecentSubmissions(
  username: string,
  session: string,
  csrfToken: string,
  limit: number = 20
): Promise<{ submissions: LeetCodeSubmission[]; hasMore: boolean }> {
  const query = `
    query recentSubmissions($username: String!, $limit: Int!) {
      recentSubmissionList(username: $username, limit: $limit) {
        id
        title
        titleSlug
        timestamp
        statusDisplay
        lang
        runtime
        memory
      }
    }
  `;

  const data = (await leetcodeGraphQL(
    query,
    { username, limit },
    { session, csrfToken }
  )) as {
    recentSubmissionList: LeetCodeSubmission[];
  };

  return {
    submissions: data.recentSubmissionList || [],
    hasMore: false, // recentSubmissionList does not support pagination
  };
}

export interface LeetCodeSubmissionDetail {
  code: string;
  lang: string;
  runtime: string;
  memory: string;
  statusDisplay: string;
  timestamp: string;
  question: {
    questionId: string;
    titleSlug: string;
    title: string;
  };
}

/**
 * Fetch the full detail (including source code) of a specific submission.
 */
export async function fetchSubmissionDetail(
  session: string,
  csrfToken: string,
  submissionId: string
): Promise<LeetCodeSubmissionDetail> {
  const query = `
    query submissionDetails($submissionId: Int!) {
      submissionDetails(submissionId: $submissionId) {
        code
        lang {
          name
          verboseName
        }
        runtime
        runtimeDisplay
        memory
        memoryDisplay
        timestamp
        statusDisplay
        question {
          questionId
          titleSlug
          title
        }
      }
    }
  `;

  const data = (await leetcodeGraphQL(
    query,
    { submissionId: parseInt(submissionId, 10) },
    { session, csrfToken }
  )) as {
    submissionDetails: {
      code: string;
      lang: { name: string; verboseName: string };
      runtime: string;
      runtimeDisplay: string;
      memory: string;
      memoryDisplay: string;
      timestamp: string;
      statusDisplay: string;
      question: {
        questionId: string;
        titleSlug: string;
        title: string;
      };
    } | null;
  };

  if (!data || !data.submissionDetails) {
    throw new LeetCodeAuthError(`LeetCode API returned null for submissionDetails. Your session has likely expired.`);
  }

  return {
    code: data.submissionDetails.code,
    lang: data.submissionDetails.lang.name,
    runtime: data.submissionDetails.runtimeDisplay || data.submissionDetails.runtime,
    memory: data.submissionDetails.memoryDisplay || data.submissionDetails.memory,
    statusDisplay: data.submissionDetails.statusDisplay,
    timestamp: data.submissionDetails.timestamp,
    question: {
      questionId: data.submissionDetails.question.questionId,
      titleSlug: data.submissionDetails.question.titleSlug,
      title: data.submissionDetails.question.title,
    },
  };
}

export interface LeetCodeProblemMeta {
  difficulty: "Easy" | "Medium" | "Hard";
  tags: string[];
  runtimePercentile?: number;
  memoryPercentile?: number;
}

/**
 * Fetch problem metadata including difficulty and tags.
 * We also try to grab percentile data if we can (some queries return it).
 */
export async function fetchProblemMeta(
  session: string,
  csrfToken: string,
  titleSlug: string
): Promise<LeetCodeProblemMeta> {
  const query = `
    query questionData($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        difficulty
        topicTags {
          name
        }
      }
    }
  `;

  const data = (await leetcodeGraphQL(
    query,
    { titleSlug },
    { session, csrfToken }
  )) as {
    question: {
      difficulty: "Easy" | "Medium" | "Hard";
      topicTags: Array<{ name: string }>;
    };
  };

  const difficulty = data.question?.difficulty || "Medium";
  const tags = data.question?.topicTags?.map((t) => t.name) || [];

  return {
    difficulty,
    tags,
    // Note: To get accurate runtime/memory percentiles on a specific submission,
    // it usually requires hitting the specific submission detail metric endpoint.
    // We'll leave these undefined for now, or you can expand this to fetch them.
  };
}

export interface LeetCodeUserStats {
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  ranking: number;
  reputation: number;
  starRating: number;
}

/**
 * Fetch a user's public profile stats.
 * We can pass the session/csrf if available, otherwise it works publicly for public profiles.
 */
export async function fetchUserProfile(
  session: string,
  csrfToken: string,
  username: string
): Promise<LeetCodeUserStats> {
  const query = `
    query userPublicProfile($username: String!) {
      matchedUser(username: $username) {
        profile {
          ranking
          reputation
          starRating
        }
        submitStatsGlobal {
          acSubmissionNum {
            difficulty
            count
          }
        }
      }
    }
  `;

  const data = (await leetcodeGraphQL(
    query,
    { username },
    { session, csrfToken }
  )) as {
    matchedUser: {
      profile: { ranking: number; reputation: number; starRating: number };
      submitStatsGlobal: {
        acSubmissionNum: Array<{ difficulty: string; count: number }>;
      };
    };
  };

  const user = data.matchedUser;
  if (!user) throw new Error("User not found on LeetCode");

  const stats = user.submitStatsGlobal.acSubmissionNum;
  const getCount = (diff: string) => stats.find((s) => s.difficulty === diff)?.count || 0;

  return {
    totalSolved: getCount("All"),
    easySolved: getCount("Easy"),
    mediumSolved: getCount("Medium"),
    hardSolved: getCount("Hard"),
    ranking: user.profile.ranking,
    reputation: user.profile.reputation,
    starRating: user.profile.starRating,
  };
}

/**
 * Fetch a user's submission calendar.
 * Returns a JSON string mapping Unix timestamps to submission counts.
 */
export async function fetchUserCalendar(
  session: string,
  csrfToken: string,
  username: string
): Promise<string> {
  const query = `
    query userProfileCalendar($username: String!, $year: Int) {
      matchedUser(username: $username) {
        userCalendar(year: $year) {
          submissionCalendar
        }
      }
    }
  `;

  const data = (await leetcodeGraphQL(
    query,
    { username },
    { session, csrfToken }
  )) as {
    matchedUser: {
      userCalendar: {
        submissionCalendar: string;
      };
    };
  };

  if (!data.matchedUser) return "{}";
  return data.matchedUser.userCalendar.submissionCalendar;
}
