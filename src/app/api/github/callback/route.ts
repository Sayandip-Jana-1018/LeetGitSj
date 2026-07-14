import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/github/callback
 * Handles the GitHub App installation callback.
 * GitHub redirects here after a user installs/configures the App.
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { searchParams } = new URL(request.url);
  const installationId = searchParams.get("installation_id");

  if (!installationId) {
    return NextResponse.redirect(
      new URL("/dashboard/settings?error=missing_installation_id", request.url)
    );
  }

  try {
    // Import here to avoid top-level errors if env vars aren't set
    const { listInstallationRepos } = await import("@/lib/github");

    // Fetch available repos for this installation
    const repos = await listInstallationRepos(parseInt(installationId, 10));

    if (repos.length === 0) {
      return NextResponse.redirect(
        new URL("/dashboard/settings?error=no_repos", request.url)
      );
    }

    // Default to the first repo — user can change later in settings
    const defaultRepo = repos[0];

    // Upsert the installation record
    await prisma.gitHubInstallation.upsert({
      where: { userId: session.user.id },
      update: {
        installationId: parseInt(installationId, 10),
        repoOwner: defaultRepo.full_name.split("/")[0],
        repoName: defaultRepo.name,
        repoFullName: defaultRepo.full_name,
        isActive: true,
      },
      create: {
        userId: session.user.id,
        installationId: parseInt(installationId, 10),
        repoOwner: defaultRepo.full_name.split("/")[0],
        repoName: defaultRepo.name,
        repoFullName: defaultRepo.full_name,
      },
    });

    return NextResponse.redirect(
      new URL(
        `/dashboard/settings?success=github_connected&repo=${encodeURIComponent(defaultRepo.full_name)}`,
        request.url
      )
    );
  } catch (err) {
    console.error("GitHub callback error:", err);
    return NextResponse.redirect(
      new URL("/dashboard/settings?error=github_callback_failed", request.url)
    );
  }
}
