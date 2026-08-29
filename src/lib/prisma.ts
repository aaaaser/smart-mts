import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = globalThis.prismaGlobal ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}

export async function checkDatabaseConnection(): Promise<{ connected: boolean; error?: string }> {
  try {
    if (!process.env.DATABASE_URL) {
      return {
        connected: false,
        error: "DATABASE_URL is not defined in environment.",
      };
    }
    // Test a lightweight query
    await prisma.$queryRaw`SELECT 1`;
    return { connected: true };
  } catch (err: any) {
    return {
      connected: false,
      error: err?.message || "Failed to connect to PostgreSQL database",
    };
  }
}
