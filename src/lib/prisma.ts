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
// We just log this as a warning. We DO NOT crash the process anymore, because Neon 
// suspends every 5 minutes and this event fires in the background. Prisma's pool 
// will automatically heal itself on the next query.
(prisma as any).$on("error", (e: any) => {
  const msg = e.message || String(e);
  if (msg.includes("Closed") || msg.includes("connection")) {
    console.log("💤 Neon database suspended (idle connection closed). Prisma will auto-reconnect on next query.");
  } else {
    console.error("Prisma Error Event:", msg);
  }
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
