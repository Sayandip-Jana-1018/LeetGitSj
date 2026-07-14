import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { listInstallationRepos } from "@/lib/github";
import { NextResponse } from "next/server";

/**
 * GET /api/github/repos
 * Lists repositories accessible to the user's GitHub App installation.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const installation = await prisma.gitHubInstallation.findUnique({
    where: { userId: session.user.id },
  });

  if (!installation) {
    return NextResponse.json({ error: "No GitHub App installation found" }, { status: 404 });
  }

  try {
    const repos = await listInstallationRepos(installation.installationId);
    return NextResponse.json({ repos });
  } catch (err) {
    console.error("Failed to list repos:", err);
    return NextResponse.json(
      { error: "Failed to fetch repositories" },
      { status: 500 }
    );
  }
}
