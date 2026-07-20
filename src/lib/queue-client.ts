/**
 * Lightweight Redis/Queue client for Vercel serverless functions.
 * 
 * This file ONLY imports ioredis (no BullMQ, no playwright, no sync-engine).
 * It uses raw Redis commands to add jobs to the BullMQ queue format,
 * so Vercel's serverless functions never need to load BullMQ.
 * 
 * The Render worker (queue.ts) uses the full BullMQ library to process jobs.
 */

import Redis from "ioredis";

let _redis: Redis | null = null;

function getRedis(): Redis {
  if (!_redis) {
    const url = process.env.REDIS_URL || "redis://localhost:6379";
    _redis = new Redis(url, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
      lazyConnect: true,
    });
  }
  return _redis;
}

const SYNC_QUEUE = "leetpush-sync";
const AUTO_CONNECT_QUEUE = "leetpush-auto-connect";

/**
 * Add a sync job to the queue using raw Redis XADD (BullMQ v5+ stream format).
 */
export async function enqueueSyncJob(userId: string): Promise<string> {
  const redis = getRedis();
  const jobId = `manual-sync-${userId}-${Date.now()}`;
  const data = JSON.stringify({ userId });

  // BullMQ uses Redis streams internally — add the job using the exact format BullMQ expects
  await redis.xadd(
    `bull:${SYNC_QUEUE}:events`,
    "*",
    "event", "waiting",
    "jobId", jobId
  );
  
  // Set the job data hash
  await redis.hset(`bull:${SYNC_QUEUE}:${jobId}`, {
    name: `sync:${userId}`,
    data,
    opts: JSON.stringify({
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: { age: 86400 },
      removeOnFail: { age: 604800 },
    }),
    timestamp: Date.now().toString(),
    delay: "0",
    priority: "0",
    processedOn: "0",
    progress: "0",
  });

  // Add to the waiting list
  await redis.lpush(`bull:${SYNC_QUEUE}:wait`, jobId);
  
  return jobId;
}

/**
 * Add an auto-connect job using raw Redis.
 */
export async function enqueueAutoConnectJob(
  userId: string,
  username: string,
  password: string
): Promise<string> {
  const redis = getRedis();
  const jobId = `auto-connect-${userId}-${Date.now()}`;
  const data = JSON.stringify({ userId, u: username, p: password });

  await redis.xadd(
    `bull:${AUTO_CONNECT_QUEUE}:events`,
    "*",
    "event", "waiting",
    "jobId", jobId
  );

  await redis.hset(`bull:${AUTO_CONNECT_QUEUE}:${jobId}`, {
    name: `auto-connect:${userId}`,
    data,
    opts: JSON.stringify({
      attempts: 1,
      removeOnComplete: { age: 3600 },
      removeOnFail: { age: 3600 },
    }),
    timestamp: Date.now().toString(),
    delay: "0",
    priority: "0",
    processedOn: "0",
    progress: "0",
  });

  await redis.lpush(`bull:${AUTO_CONNECT_QUEUE}:wait`, jobId);

  return jobId;
}

/**
 * Redis-backed rate limiter for manual syncs (1 per 60 seconds).
 */
export async function checkSyncRateLimit(userId: string): Promise<boolean> {
  const redis = getRedis();
  const key = `ratelimit:sync:${userId}`;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, 60);
  }
  return count <= 1;
}

/**
 * Rate limiter for auto-connect (3 per 10 minutes).
 */
export async function checkAutoConnectRateLimit(
  userId: string
): Promise<{ allowed: boolean; remaining: number }> {
  const redis = getRedis();
  const key = `auto-connect:rate:${userId}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 600);
  return { allowed: count <= 3, remaining: Math.max(0, 3 - count) };
}
