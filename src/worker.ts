import { startWorker } from "./lib/queue";

console.log("🚀 Starting LeetPush Background Worker...");

const worker = startWorker();

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
