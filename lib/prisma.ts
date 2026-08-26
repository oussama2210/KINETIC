import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Supabase's pooler hostname (aws-1-eu-west-1.pooler.supabase.com) resolves to
 * multiple IPs and some are intermittently unreachable from certain networks,
 * producing transient Prisma P1001 ("Can't reach database server") errors.
 *
 * This wrapper retries those transient failures with a short backoff.
 */
const TRANSIENT_ERROR_CODES = new Set(["P1001", "P1008", "P1017", "P2024"]);

export async function withDbRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const code =
        typeof error === "object" && error !== null && "code" in error
          ? String((error as { code?: unknown }).code)
          : "";
      const message =
        error instanceof Error ? error.message : String(error ?? "");
      const isTransient =
        TRANSIENT_ERROR_CODES.has(code) ||
        message.includes("Can't reach database server");

      if (!isTransient || attempt === maxRetries) {
        throw error;
      }

      // Short exponential backoff: 300ms, 600ms, 1200ms
      await new Promise((resolve) => setTimeout(resolve, 300 * 2 ** attempt));
    }
  }

  throw lastError;
}
