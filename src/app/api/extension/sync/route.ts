import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { commitSolutionFolder } from "@/lib/github";
import { buildFolderPath } from "@/lib/sync-engine";
import { getFileExtension } from "@/lib/leetcode";
import { generateReadme } from "@/lib/readme-gen";

export const maxDuration = 60; // Vercel/Render serverless max duration

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const secret = authHeader.split(" ")[1];
    if (!secret) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // @ts-ignore - Ignore stale Prisma types in IDE
    const user = await prisma.user.findUnique({
      // @ts-ignore
      where: { extensionSecret: secret },
      include: {
        githubInstallation: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid secret key" }, { status: 401 });
    }

    // @ts-ignore
    if (!user.githubInstallation || !user.githubInstallation.isActive) {
      return NextResponse.json({ error: "GitHub is not connected or active" }, { status: 400 });
    }

    const body = await request.json();
    const {
      leetcodeSubmissionId,
      questionId,
      title,
      titleSlug,
      difficulty,
      tags,
      runtime,
      memory,
      runtimePercentile,
      memoryPercentile,
      code,
      lang,
    } = body;

    if (!leetcodeSubmissionId || !titleSlug || !code) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if already synced
    const existing = await prisma.syncedSubmission.findUnique({
      where: { leetcodeSubmissionId: String(leetcodeSubmissionId) },
    });

    if (existing) {
      return NextResponse.json({ message: "Already synced" }, { status: 200 });
    }

    const ext = getFileExtension(lang);
    const folderPath = buildFolderPath(questionId, titleSlug);
    const solutionFileName = `solution.${ext}`;

    const readme = await generateReadme({
      questionId: String(questionId),
      title,
      titleSlug,
      difficulty: difficulty || "Unknown",
      tags: tags || [],
      code,
      lang,
      runtime: runtime || "N/A",
      memory: memory || "N/A",
      runtimePercentile: runtimePercentile || 0,
      memoryPercentile: memoryPercentile || 0,
      submissionId: String(leetcodeSubmissionId),
    });

    // @ts-ignore
    const commitMessage = user.githubInstallation.commitMessageTemplate
      .replace("{questionId}", String(questionId))
      .replace("{titleSlug}", titleSlug)
      .replace("{title}", title)
      .replace("{lang}", lang)
      .replace("{difficulty}", difficulty || "Unknown");

    const { sha, commitUrl } = await commitSolutionFolder(
      // @ts-ignore
      user.githubInstallation.installationId,
      // @ts-ignore
      user.githubInstallation.repoFullName,
      [
        { path: `${folderPath}/${solutionFileName}`, content: code },
        { path: `${folderPath}/README.md`, content: readme.content },
      ],
      commitMessage,
      // @ts-ignore
      user.githubInstallation.defaultBranch || "main",
      user.name || undefined,
      user.email || undefined
    );

    const submission = await prisma.syncedSubmission.create({
      data: {
        userId: user.id,
        leetcodeSubmissionId: String(leetcodeSubmissionId),
        problemSlug: titleSlug,
        problemTitle: title,
        questionId: String(questionId),
        language: lang,
        difficulty: difficulty || "Unknown",
        tags: tags || [],
        runtime: runtime || "N/A",
        memory: memory || "N/A",
        runtimePercentile: runtimePercentile || 0,
        memoryPercentile: memoryPercentile || 0,
        commitSha: sha,
        commitUrl: commitUrl,
      },
    });

    return NextResponse.json({ message: "Success", submission }, { status: 200 });
  } catch (error) {
    console.error("Extension sync error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
