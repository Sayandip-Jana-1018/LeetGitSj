import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error"] : ["error"],
    datasources: {
      db: {
        // Add pool_timeout & connect_timeout to survive Neon cold-start wakeups
        url: process.env.DATABASE_URL?.includes("?")
          ? `${process.env.DATABASE_URL}&connect_timeout=30&pool_timeout=30`
          : `${process.env.DATABASE_URL}?connect_timeout=30&pool_timeout=30`,
      },
    },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
