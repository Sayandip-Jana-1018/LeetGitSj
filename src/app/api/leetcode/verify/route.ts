import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";
import { verifyCredentials } from "@/lib/leetcode";
import { NextResponse } from "next/server";

/**
 * POST /api/leetcode/verify
 * Re-verifies an existing stored LeetCode credential.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const credential = await prisma.leetCodeCredential.findUnique({
    where: { userId: session.user.id },
  });

  if (!credential) {
    return NextResponse.json(
      { error: "No LeetCode credential found", valid: false },
      { status: 404 }
    );
  }

  try {
    const lcSession = decrypt(credential.encryptedSession);
    const csrfToken = decrypt(credential.encryptedCsrfToken);

    const profile = await verifyCredentials(lcSession, csrfToken);

    // Update last verified timestamp
    await prisma.leetCodeCredential.update({
      where: { userId: session.user.id },
      data: {
        status: "ACTIVE",
        lastVerifiedAt: new Date(),
        leetcodeUsername: profile.username,
      },
    });

    return NextResponse.json({
      valid: true,
      username: profile.username,
    });
  } catch {
    // Mark as expired if verification fails
    await prisma.leetCodeCredential.update({
      where: { userId: session.user.id },
      data: { status: "EXPIRED" },
    });

    return NextResponse.json({
      valid: false,
      error: "LeetCode session has expired — please reconnect",
    });
  }
}
