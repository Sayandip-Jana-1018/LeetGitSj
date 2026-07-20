import Redis from "ioredis";

async function run() {
  const redis = new Redis(process.env.REDIS_URL!);
  
  const waitSync = await redis.lrange("bull:leetpush-sync:wait", 0, -1);
  console.log("Wait sync:", waitSync);

  const activeSync = await redis.lrange("bull:leetpush-sync:active", 0, -1);
  console.log("Active sync:", activeSync);

  process.exit(0);
}

run();
