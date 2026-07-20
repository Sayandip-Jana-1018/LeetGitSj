/**
 * POST /api/leetcode/auto-connect
 *
 * Enqueues a Playwright-based auto-login job in the background worker.
 * Uses lightweight Redis client (no BullMQ) so it works on Vercel serverless.
 *
 * Security notes:
 * - Requires auth (session check)
 * - Rate-limited to 3 attempts per 10 minutes per user
 * - Credentials are NOT stored before verification; worker handles that
 * - Queue payload is ephemeral (1h TTL)
 */

import { auth } from "@/auth";
import { enqueueAutoConnectJob, checkAutoConnectRateLimit } from "@/lib/queue-client";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { allowed, remaining } = await checkAutoConnectRateLimit(session.user.id);
  if (!allowed) {
    return NextResponse.json(
      { error: `Too many auto-connect attempts. Please wait 10 minutes or use Manual Connect.` },
      { status: 429 }
    );
  }

  let body: { username: string; password: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { username, password } = body;
  if (!username?.trim() || !password?.trim()) {
    return NextResponse.json(
      { error: "Both username and password are required" },
      { status: 400 }
    );
  }

  try {
    const jobId = await enqueueAutoConnectJob(
      session.user.id,
      username.trim(),
      password  // never trimmed — passwords can have leading/trailing spaces
    );

    return NextResponse.json({
      status: "queued",
      jobId,
      attemptsRemaining: remaining,
      message: "Auto-connect job enqueued. This takes 10-30 seconds.",
    });
  } catch (err) {
    console.error("Auto-connect enqueue error:", err);
    return NextResponse.json(
      { error: "Failed to enqueue auto-connect job" },
      { status: 500 }
    );
  }
}
