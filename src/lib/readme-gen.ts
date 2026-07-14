/**
 * README Generator — Provider-Agnostic Interface
 *
 * Uses Gemini Flash Lite for fast, cheap per-submission README generation.
 * Falls back gracefully to a metadata-only README if the AI call fails.
 * Routes through a provider-agnostic interface so swapping backends is trivial.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

export interface ReadmeInput {
  questionId: string;
  title: string;
  titleSlug: string;
  difficulty: string;
  tags: string[];
  code: string;
  lang: string;
  runtime: string;
  memory: string;
  runtimePercentile?: number;
  memoryPercentile?: number;
  submissionId?: string;
}

export interface ReadmeSections {
  content: string;
  isAiGenerated: boolean;
}

// ============================================================
// Provider-agnostic interface — swap this adapter to change AI backends
// ============================================================

async function generateWithGemini(input: ReadmeInput): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const genAI = new GoogleGenerativeAI(apiKey);
  // gemini-2.5-flash-lite: fastest, cheapest, free tier friendly
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

  const prompt = `You are helping document a LeetCode solution for a developer's GitHub portfolio.

Problem: ${input.title} (${input.difficulty})
Tags: ${input.tags.join(", ")}
Language: ${input.lang}

Code submitted:
\`\`\`${input.lang}
${input.code}
\`\`\`

Write ONLY the following two sections in plain markdown. Be concise and direct. Do NOT reproduce or closely paraphrase the exact LeetCode problem statement — just give a brief conceptual summary in your own words (2-3 sentences max).

## Problem Summary
[A short paraphrase of what the problem asks, in your own words. End with: "See the [full problem on LeetCode](https://leetcode.com/problems/${input.titleSlug}/)."]

## Approach
[A plain-English explanation of the algorithm/technique used, reading from the code. Name the pattern (e.g. "sliding window", "BFS", "two pointers + hash map"). 2-4 sentences.]

## Complexity (AI Estimate)
> ⚠️ *These are AI-inferred estimates — verify independently.*
- **Time:** O(...)
- **Space:** O(...)`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    clearTimeout(timeout);
    return text.trim();
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

// ============================================================
// Fallback README (no AI sections)
// ============================================================

function buildFallbackReadme(input: ReadmeInput): string {
  const difficultyEmoji =
    input.difficulty === "Easy" ? "🟢" : input.difficulty === "Medium" ? "🟡" : "🔴";
  const lcUrl = `https://leetcode.com/problems/${input.titleSlug}/`;
  const submissionUrl = input.submissionId
    ? `https://leetcode.com/submissions/detail/${input.submissionId}/`
    : null;

  return `# ${input.questionId}. ${input.title}

${difficultyEmoji} **${input.difficulty}** · ${input.tags.map((t) => `\`${t}\``).join(" ")}

## Performance (Measured on LeetCode)

| Metric | Result |
|--------|--------|
| Runtime | ${input.runtime}${input.runtimePercentile ? ` · Beats ${input.runtimePercentile.toFixed(1)}%` : ""} |
| Memory | ${input.memory}${input.memoryPercentile ? ` · Beats ${input.memoryPercentile.toFixed(1)}%` : ""} |
| Language | ${input.lang} |

## Links

- [View Problem on LeetCode](${lcUrl})${submissionUrl ? `\n- [View My Submission](${submissionUrl})` : ""}
`;
}

// ============================================================
// Main export
// ============================================================

export async function generateReadme(input: ReadmeInput): Promise<ReadmeSections> {
  const difficultyEmoji =
    input.difficulty === "Easy" ? "🟢" : input.difficulty === "Medium" ? "🟡" : "🔴";
  const lcUrl = `https://leetcode.com/problems/${input.titleSlug}/`;
  const submissionUrl = input.submissionId
    ? `https://leetcode.com/submissions/detail/${input.submissionId}/`
    : null;

  // Try AI generation
  try {
    const aiSections = await generateWithGemini(input);

    const fullReadme = `# ${input.questionId}. ${input.title}

${difficultyEmoji} **${input.difficulty}** · ${input.tags.map((t) => `\`${t}\``).join(" ")}

${aiSections}

## Performance (Measured on LeetCode)

| Metric | Result |
|--------|--------|
| Runtime | ${input.runtime}${input.runtimePercentile ? ` · Beats ${input.runtimePercentile.toFixed(1)}%` : ""} |
| Memory | ${input.memory}${input.memoryPercentile ? ` · Beats ${input.memoryPercentile.toFixed(1)}%` : ""} |
| Language | ${input.lang} |

## Links

- [View Problem on LeetCode](${lcUrl})${submissionUrl ? `\n- [View My Submission](${submissionUrl})` : ""}
`;

    return { content: fullReadme, isAiGenerated: true };
  } catch (err) {
    // Log but never let AI failure block the sync
    console.error("[readme-gen] AI generation failed, using fallback:", err instanceof Error ? err.message : err);
    return { content: buildFallbackReadme(input), isAiGenerated: false };
  }
}
