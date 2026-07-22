import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" }); // fallback

import { startWorker, getSyncQueue } from "./lib/queue";
import { prisma } from "./lib/prisma";
import http from "http";

console.log("🚀 Starting LeetPush Background Worker...");

const worker = startWorker();

// --- CRON SCHEDULER ---
// Run every 4 hours to fetch new submissions silently
const SYNC_INTERVAL_MS = 4 * 60 * 60 * 1000; 

async function scheduleAllUsers(retryCount = 0) {
  console.log("⏰ Running scheduled cron sync for all active users...");
  try {
    const activeCredentials = await prisma.leetCodeCredential.findMany({
      where: { status: "ACTIVE" }
    });
    
    console.log(`Found ${activeCredentials.length} active users to sync.`);
    const syncQueue = getSyncQueue();
    
    for (const cred of activeCredentials) {
      await syncQueue.add(
        `sync:${cred.userId}`,
        { userId: cred.userId },
        { 
          jobId: `cron-sync-${cred.userId}-${Date.now()}`,
          removeOnComplete: { age: 3600 },
          removeOnFail: { age: 3600 }
        }
      );
    }
  } catch (error: any) {
    if (retryCount < 3) {
      console.log(`💤 Database waking up. Retrying schedule loop in 5 seconds... (Attempt ${retryCount + 1})`);
      setTimeout(() => scheduleAllUsers(retryCount + 1), 5000);
      return;
    }
    console.error("❌ Error scheduling users after retries:", error);
  }
}

// Start the scheduler
setInterval(scheduleAllUsers, SYNC_INTERVAL_MS);
// Run initial pass 10 seconds after boot
setTimeout(scheduleAllUsers, 10000);

const PORT = process.env.PORT || 8080;
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("LeetGitSj Worker is running and healthy!\n");
});

server.listen(PORT, () => {
  console.log(`✅ Dummy web server listening on port ${PORT} (to keep Render happy)`);
});
process.on("SIGTERM", async () => {
  console.log("Shutting down worker...");
  await worker.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("Shutting down worker...");
  await worker.close();
  process.exit(0);
});
