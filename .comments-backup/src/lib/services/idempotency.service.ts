import { prisma } from "@/lib/db/prisma";
import { addHours } from "date-fns";

const TTL_HOURS = 24;

export type IdempotencyResult<T> = {
  status: number;
  body: T;
  cached: boolean;
};

/**
 * Wrap any operation with idempotency.
 * If a request with the same key has been processed before (within TTL),
 * the original response is returned without re-executing the operation.
 *
 * @param key   The value of the Idempotency-Key request header
 * @param fn    The operation to run on first call
 */
export async function withIdempotency<T>(
  key: string,
  fn: () => Promise<{ status: number; body: T }>
): Promise<IdempotencyResult<T>> {
  const existing = await prisma.idempotencyKey.findUnique({ where: { key } });

  if (existing && existing.expiresAt > new Date()) {
    return {
      status: existing.statusCode,
      body: existing.responseBody as T,
      cached: true,
    };
  }

  const result = await fn();

  // Upsert in case of a race between two concurrent identical keys
  await prisma.idempotencyKey.upsert({
    where: { key },
    create: {
      key,
      statusCode: result.status,
      responseBody: result.body as object,
      expiresAt: addHours(new Date(), TTL_HOURS),
    },
    update: {
      statusCode: result.status,
      responseBody: result.body as object,
      expiresAt: addHours(new Date(), TTL_HOURS),
    },
  });

  return { ...result, cached: false };
}
