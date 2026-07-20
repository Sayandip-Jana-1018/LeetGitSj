import { enqueueSyncJob } from "./src/lib/queue-client";
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

async function test() {
  const jobId = await enqueueSyncJob("test-user-id");
  console.log("Enqueued job:", jobId);
  process.exit(0);
}

test();
