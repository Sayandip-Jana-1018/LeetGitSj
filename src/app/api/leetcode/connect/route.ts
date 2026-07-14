import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";
import { verifyCredentials } from "@/lib/leetcode";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/leetcode/connect
 * Connects a LeetCode account by validating and storing encrypted session cookies.
 *
 * Body: { session: string, csrfToken: string }
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { session: string; csrfToken: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { session: lcSession, csrfToken } = body;

  if (!lcSession || !csrfToken) {
    return NextResponse.json(
      { error: "Both session and csrfToken are required" },
      { status: 400 }
    );
  }

  // Trim whitespace that might come from copy-paste
  const cleanSession = lcSession.trim();
  const cleanCsrf = csrfToken.trim();

  // Immediately verify the credentials against LeetCode
  try {
    const profile = await verifyCredentials(cleanSession, cleanCsrf);

    // Encrypt before storing
    const encryptedSession = encrypt(cleanSession);
    const encryptedCsrfToken = encrypt(cleanCsrf);

    // Upsert the credential
    await prisma.leetCodeCredential.upsert({
      where: { userId: session.user.id },
      update: {
        encryptedSession,
        encryptedCsrfToken,
        leetcodeUsername: profile.username,
        status: "ACTIVE",
        lastVerifiedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        encryptedSession,
        encryptedCsrfToken,
        leetcodeUsername: profile.username,
        status: "ACTIVE",
        lastVerifiedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      username: profile.username,
      message: `Connected as ${profile.username}`,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to verify LeetCode credentials";
    return NextResponse.json(
      { error: message, success: false },
      { status: 400 }
    );
  }
}
