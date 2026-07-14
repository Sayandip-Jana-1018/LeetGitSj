import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * PATCH /api/github/installation
 * Updates GitHub installation settings (repo, folder pattern, commit template).
 */
export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    repoFullName?: string;
    folderPattern?: string;
    commitMessageTemplate?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const installation = await prisma.gitHubInstallation.findUnique({
    where: { userId: session.user.id },
  });

  if (!installation) {
    return NextResponse.json({ error: "No installation found" }, { status: 404 });
  }

  const updateData: Record<string, string> = {};

  if (body.repoFullName) {
    const parts = body.repoFullName.split("/");
    if (parts.length !== 2) {
      return NextResponse.json({ error: "Invalid repo format (expected owner/repo)" }, { status: 400 });
    }
    updateData.repoOwner = parts[0];
    updateData.repoName = parts[1];
    updateData.repoFullName = body.repoFullName;
  }

  if (body.folderPattern !== undefined) {
    updateData.folderPattern = body.folderPattern;
  }

  if (body.commitMessageTemplate !== undefined) {
    updateData.commitMessageTemplate = body.commitMessageTemplate;
  }

  const updated = await prisma.gitHubInstallation.update({
    where: { userId: session.user.id },
    data: updateData,
  });

  return NextResponse.json({ success: true, installation: updated });
}
