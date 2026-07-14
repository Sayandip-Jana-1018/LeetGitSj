import { Queue, Worker, QueueEvents, Job } from "bullmq";
import Redis from "ioredis";
import { syncUserSubmissions } from "./sync-engine";
import { autoLoginLeetCode } from "./leetcode-auto-login";
import { encrypt } from "./encryption";
import { prisma } from "./prisma";

// Helper to get Redis connection for BullMQ
function getRedisConnection() {
  const url = process.env.REDIS_URL || "redis://localhost:6379";

  // Hard fail immediately with actionable message — BullMQ cannot use HTTP REST URLs
  if (!url.startsWith("redis://") && !url.startsWith("rediss://")) {
    throw new Error(
      `\n\n[LeetPush Worker] REDIS_URL is not a valid TCP connection string.\n` +
      `Current value starts with: "${url.slice(0, 20)}..."\n\n` +
      `BullMQ requires a TCP Redis connection, not an HTTP REST endpoint.\n\n` +
      `To fix: Go to Upstash Console → Your DB → Connect tab → Node.js (ioredis)\n` +
      `Copy the connection string starting with: rediss://default:TOKEN@HOST:PORT\n` +
      `Then set it as REDIS_URL in your .env.local file.\n`
    );
  }

  return new Redis(url, {
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false,
  });
}

// Global connection to reuse
const connection = getRedisConnection();

export const SYNC_QUEUE_NAME = "leetpush-sync";

// The Queue instance for adding jobs
export const syncQueue = new Queue(SYNC_QUEUE_NAME, {
  connection: connection as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: { age: 24 * 3600 }, // keep 24 hours
    removeOnFail: { age: 7 * 24 * 3600 }, // keep 7 days
  },
});

export const syncQueueEvents = new QueueEvents(SYNC_QUEUE_NAME, { connection: connection as any });

export const AUTO_CONNECT_QUEUE_NAME = "leetpush-auto-connect";

export const autoConnectQueue = new Queue(AUTO_CONNECT_QUEUE_NAME, {
  connection: connection as any,
  defaultJobOptions: {
    attempts: 1, // Don't retry auto-login — if it hits a CAPTCHA, it fails immediately
    removeOnComplete: { age: 3600 },
    removeOnFail: { age: 3600 },
  },
});

export const autoConnectQueueEvents = new QueueEvents(AUTO_CONNECT_QUEUE_NAME, {
  connection: connection as any,
});

// Initialize the Worker if we're running in a worker context
// In Next.js, we don't want the worker running in the main web server process usually,
// but for a simple all-in-one deploy, we can start it here.
let worker: Worker | null = null;

export function startWorker() {
  if (worker) return worker;

  worker = new Worker(
    SYNC_QUEUE_NAME,
    async (job: Job<{ userId: string }>) => {
      console.log(`[Worker] Processing sync job for user ${job.data.userId}`);
      
      const lockKey = `sync:lock:${job.data.userId}`;
      const locked = await connection.set(lockKey, "1", "EX", 300, "NX");
      
      if (!locked) {
        throw new Error("Sync already in progress for this user (lock active)");
      }

      // Check if this user's credential has recently expired
      const expiredKey = `expired:${job.data.userId}`;
      const isExpired = await connection.exists(expiredKey);
      if (isExpired) {
        // Skip job processing silently to prevent hammering LeetCode
        await connection.del(lockKey);
        console.log(`[Worker] Skipping sync for ${job.data.userId} due to recently expired credential`);
        return { status: "skipped_expired" };
      }
      
      try {
        const result = await syncUserSubmissions(job.data.userId);
        return result;
      } finally {
        await connection.del(lockKey);
      }
    },
    {
      connection: connection as any,
      concurrency: 5,
    }
  );

  worker.on("completed", (job, result) => {
    console.log(`[Worker] Job ${job.id} completed. Result: ${result?.status}`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed:`, err);
  });

  // Start the Auto-Connect worker
  const acWorker = new Worker(
    AUTO_CONNECT_QUEUE_NAME,
    async (job: Job<{ userId: string; u: string; p: string }>) => {
      console.log(`[Worker] Processing auto-connect for user ${job.data.userId}`);
      
      const { session, csrfToken, username } = await autoLoginLeetCode(job.data.u, job.data.p);
      
      const encryptedSession = encrypt(session);
      const encryptedCsrfToken = encrypt(csrfToken);

      await prisma.leetCodeCredential.upsert({
        where: { userId: job.data.userId },
        update: {
          encryptedSession,
          encryptedCsrfToken,
          leetcodeUsername: username,
          status: "ACTIVE",
          lastVerifiedAt: new Date(),
        },
        create: {
          userId: job.data.userId,
          encryptedSession,
          encryptedCsrfToken,
          leetcodeUsername: username,
          status: "ACTIVE",
          lastVerifiedAt: new Date(),
        },
      });

      await clearExpiredFlag(job.data.userId);

      // Fire initial sync
      await syncQueue.add(
        `sync:${job.data.userId}`,
        { userId: job.data.userId },
        { jobId: `auto-sync-${job.data.userId}-${Date.now()}` }
      );

      return { username };
    },
    {
      connection: connection as any,
      concurrency: 2, // Playwright uses memory, keep concurrency low
    }
  );

  acWorker.on("failed", (job, err) => {
    console.error(`[AutoConnect Worker] Job failed:`, err);
  });

  return worker;
}

// Redis-backed rate limiter for manual syncs
export async function checkRateLimit(userId: string): Promise<boolean> {
  const key = `ratelimit:sync:${userId}`;
  const count = await connection.incr(key);
  
  if (count === 1) {
    // 1 sync per 60 seconds allowed manually
    await connection.expire(key, 60);
  }
  
  return count <= 1;
}

// Clear expired flag on successful reconnect
export async function clearExpiredFlag(userId: string): Promise<void> {
  const expiredKey = `expired:${userId}`;
  await connection.del(expiredKey);
}

// Set expired flag to backoff for 23 hours
export async function setExpiredFlag(userId: string): Promise<void> {
  const expiredKey = `expired:${userId}`;
  await connection.set(expiredKey, "1", "EX", 23 * 3600); // 23 hours
}
