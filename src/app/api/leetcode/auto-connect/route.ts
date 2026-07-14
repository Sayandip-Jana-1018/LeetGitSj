/**
 * POST /api/leetcode/auto-connect
 *
 * Enqueues a Playwright-based auto-login job in the background worker.
 * Credentials are passed through the queue payload (u, p) and never logged.
 * Responds immediately with the job ID — poll /api/sync/status for results.
 *
 * Security notes:
 * - Requires auth (session check)
 * - Rate-limited to 3 attempts per 10 minutes per user
 * - Credentials are NOT stored before verification; worker handles that
 * - Queue payload is ephemeral (1h TTL)
 */

import { auth } from "@/auth";
import { autoConnectQueue } from "@/lib/queue";
import { NextRequest, NextResponse } from "next/server";
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: 1,
  enableReadyCheck: false,
});

const MAX_ATTEMPTS = 3;
const WINDOW_SECONDS = 600; // 10 minutes

async function checkAutoConnectRateLimit(userId: string): Promise<{ allowed: boolean; remaining: number }> {
  const key = `auto-connect:rate:${userId}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, WINDOW_SECONDS);
  return { allowed: count <= MAX_ATTEMPTS, remaining: Math.max(0, MAX_ATTEMPTS - count) };
}

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
    const job = await autoConnectQueue.add(
      `auto-connect:${session.user.id}`,
      {
        userId: session.user.id,
        u: username.trim(),
        p: password, // never trimmed — passwords can have leading/trailing spaces
      },
      {
        jobId: `auto-connect-${session.user.id}-${Date.now()}`,
        removeOnComplete: { age: 3600 },
        removeOnFail: { age: 3600 },
      }
    );

    return NextResponse.json({
      status: "queued",
      jobId: job.id,
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
