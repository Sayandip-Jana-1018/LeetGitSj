import { auth } from "@/auth";
import { enqueueSyncJob, checkSyncRateLimit } from "@/lib/queue-client";
import { NextResponse } from "next/server";

/**
 * POST /api/sync/trigger
 * Manual "Sync now" button handler.
 * Enqueues a job via lightweight Redis client (no BullMQ import).
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
    const allowed = await checkSyncRateLimit(userId);
    if (!allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait 60 seconds." },
        { status: 429 }
      );
    }

    // 2. Enqueue the job
    const jobId = await enqueueSyncJob(userId);

    return NextResponse.json({
      status: "queued",
      jobId,
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
