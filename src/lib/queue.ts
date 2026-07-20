import { Queue, Worker, QueueEvents, Job } from "bullmq";
import Redis from "ioredis";

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

// Lazy connection — only created when actually needed (avoids crash in Vercel serverless)
let _connection: Redis | null = null;
function getConnection(): Redis {
  if (!_connection) {
    _connection = getRedisConnection();
  }
  return _connection;
}

export const SYNC_QUEUE_NAME = "leetpush-sync";

// Lazy queue — only created when first accessed
let _syncQueue: Queue | null = null;
export function getSyncQueue(): Queue {
  if (!_syncQueue) {
    _syncQueue = new Queue(SYNC_QUEUE_NAME, {
      connection: getConnection() as never,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
        removeOnComplete: { age: 24 * 3600 },
        removeOnFail: { age: 7 * 24 * 3600 },
      },
    });
  }
  return _syncQueue;
}

// Keep backward-compat export (getter)
export const syncQueue = new Proxy({} as Queue, {
  get(_, prop) {
    return (getSyncQueue() as never)[prop];
  },
});

let _syncQueueEvents: QueueEvents | null = null;
export function getSyncQueueEvents(): QueueEvents {
  if (!_syncQueueEvents) {
    _syncQueueEvents = new QueueEvents(SYNC_QUEUE_NAME, { connection: getConnection() as never });
  }
  return _syncQueueEvents;
}

export const syncQueueEvents = new Proxy({} as QueueEvents, {
  get(_, prop) {
    return (getSyncQueueEvents() as never)[prop];
  },
});

export const AUTO_CONNECT_QUEUE_NAME = "leetpush-auto-connect";

let _autoConnectQueue: Queue | null = null;
export function getAutoConnectQueue(): Queue {
  if (!_autoConnectQueue) {
    _autoConnectQueue = new Queue(AUTO_CONNECT_QUEUE_NAME, {
      connection: getConnection() as never,
      defaultJobOptions: {
        attempts: 1,
        removeOnComplete: { age: 3600 },
        removeOnFail: { age: 3600 },
      },
    });
  }
  return _autoConnectQueue;
}

export const autoConnectQueue = new Proxy({} as Queue, {
  get(_, prop) {
    return (getAutoConnectQueue() as never)[prop];
  },
});

let _autoConnectQueueEvents: QueueEvents | null = null;
export function getAutoConnectQueueEvents(): QueueEvents {
  if (!_autoConnectQueueEvents) {
    _autoConnectQueueEvents = new QueueEvents(AUTO_CONNECT_QUEUE_NAME, { connection: getConnection() as never });
  }
  return _autoConnectQueueEvents;
}

export const autoConnectQueueEvents = new Proxy({} as QueueEvents, {
  get(_, prop) {
    return (getAutoConnectQueueEvents() as never)[prop];
  },
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
      // Dynamic import — only loaded in the worker process, never on Vercel
      const { syncUserSubmissions } = await import("./sync-engine");

      console.log(`[Worker] Processing sync job for user ${job.data.userId}`);
      
      const lockKey = `sync:lock:${job.data.userId}`;
      const locked = await getConnection().set(lockKey, "1", "EX", 300, "NX");
      
      if (!locked) {
        throw new Error("Sync already in progress for this user (lock active)");
      }

      // Check if this user's credential has recently expired
      const expiredKey = `expired:${job.data.userId}`;
      const isExpired = await getConnection().exists(expiredKey);
      if (isExpired) {
        // Skip job processing silently to prevent hammering LeetCode
        await getConnection().del(lockKey);
        console.log(`[Worker] Skipping sync for ${job.data.userId} due to recently expired credential`);
        return { status: "skipped_expired" };
      }
      
      try {
        const result = await syncUserSubmissions(job.data.userId);
        return result;
      } finally {
        await getConnection().del(lockKey);
      }
    },
    {
      connection: getConnection() as never,
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
      // Dynamic imports — only loaded in the worker process
      const { autoLoginLeetCode } = await import("./leetcode-auto-login");
      const { encrypt } = await import("./encryption");
      const { prisma } = await import("./prisma");

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
      connection: getConnection() as never,
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
  const count = await getConnection().incr(key);
  
  if (count === 1) {
    // 1 sync per 60 seconds allowed manually
    await getConnection().expire(key, 60);
  }
  
  return count <= 1;
}

// Clear expired flag on successful reconnect
export async function clearExpiredFlag(userId: string): Promise<void> {
  const expiredKey = `expired:${userId}`;
  await getConnection().del(expiredKey);
}

// Set expired flag to backoff for 23 hours
export async function setExpiredFlag(userId: string): Promise<void> {
  const expiredKey = `expired:${userId}`;
  await getConnection().set(expiredKey, "1", "EX", 23 * 3600); // 23 hours
}
