import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: [
      { emit: "event", level: "error" },
      { emit: "stdout", level: "warn" },
    ],
    datasources: {
      db: {
        // Add pool_timeout & connect_timeout to survive Neon cold-start wakeups
        url: process.env.DATABASE_URL?.includes("?")
          ? `${process.env.DATABASE_URL}&connect_timeout=30&pool_timeout=30`
          : `${process.env.DATABASE_URL}?connect_timeout=30&pool_timeout=30`,
      },
    },
  });

// Handle Neon idle connection drops (Error { kind: Closed, cause: None })
// By capturing the internal Prisma error event, we can gracefully crash the worker
// and let Render automatically restart it with a fresh connection pool.
(prisma as any).$on("error", (e: any) => {
  console.error("Prisma Error Event:", e.message || e);
  const msg = e.message || String(e);
  if (msg.includes("Closed") || msg.includes("connection")) {
    console.log("♻️ Restarting worker to recover Database connection pool...");
    process.exit(1);
  }
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
