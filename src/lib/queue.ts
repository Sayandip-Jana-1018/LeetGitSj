import { Queue, Worker, QueueEvents, Job } from "bullmq";
import Redis from "ioredis";
import { syncUserSubmissions } from "./sync-engine";

// Helper to get Redis connection for BullMQ
function getRedisConnection() {
  const url = process.env.REDIS_URL || "redis://localhost:6379";
  
  // Warn if user provided an Upstash REST URL instead of TCP
  if (url.startsWith("http")) {
    console.warn("⚠️ REDIS_URL appears to be an HTTP REST endpoint. BullMQ requires a TCP Redis connection (redis:// or rediss://). Please update your environment variables.");
  }
  
  // Combine url and token if they provided upstash token separately
  const token = process.env.REDIS_TOKEN;
  if (url.includes("upstash.io") && !url.includes("@") && token) {
    const cleanUrl = url.replace("https://", "rediss://").replace("http://", "redis://");
    return new Redis(cleanUrl, {
      password: token,
      maxRetriesPerRequest: null, // Required by BullMQ
    });
  }

  return new Redis(url, {
    maxRetriesPerRequest: null, // Required by BullMQ
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
