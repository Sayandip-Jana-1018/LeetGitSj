import { auth } from "@/auth";
import { syncQueue, checkRateLimit } from "@/lib/queue";
import { NextResponse } from "next/server";

/**
 * POST /api/sync/trigger
 * Manual "Sync now" button handler.
 * Enqueues a job in BullMQ and returns immediately.
 * Redis-backed rate limited to 1 per 60s per user.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    // 1. Enforce rate limit
    const allowed = await checkRateLimit(userId);
    if (!allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait 60 seconds." },
        { status: 429 }
      );
    }

    // 2. Enqueue the job
    await syncQueue.add(
      `sync:${userId}`,
      { userId },
      { jobId: `manual-sync-${userId}-${Date.now()}` }
    );

    return NextResponse.json({
      status: "queued",
      message: "Sync job enqueued successfully",
    });
  } catch (err) {
    console.error("Sync trigger error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to enqueue sync" },
      { status: 500 }
    );
  }
}
