import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" }); // fallback

import { startWorker } from "./lib/queue";

console.log("🚀 Starting LeetPush Background Worker...");

const worker = startWorker();

import http from "http";

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
