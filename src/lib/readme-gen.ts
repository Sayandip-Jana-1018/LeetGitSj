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

async function generateWithGemini(input: ReadmeInput, modelName: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName });

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

  // Try AI generation with multi-tiered fallbacks
  const aiModels = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
  let aiSections: string | null = null;
  let lastError: unknown = null;

  for (const model of aiModels) {
    try {
      aiSections = await generateWithGemini(input, model);
      break; // Success! Break out of fallback loop
    } catch (err) {
      console.warn(`[readme-gen] Model ${model} failed, trying next fallback...`, err instanceof Error ? err.message : err);
      lastError = err;
    }
  }

  if (aiSections) {
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
  } else {
    // Log but never let AI failure block the sync
    console.error("[readme-gen] All AI models failed, using non-AI fallback. Last error:", lastError instanceof Error ? lastError.message : lastError);
    return { content: buildFallbackReadme(input), isAiGenerated: false };
  }
}
