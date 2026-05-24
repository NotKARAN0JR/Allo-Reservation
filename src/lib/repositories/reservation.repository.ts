import type { PrismaClient, Reservation } from "@prisma/client";
import type { ITXClientDenyList } from "@prisma/client/runtime/library";

type TransactionClient = Omit<PrismaClient, ITXClientDenyList>;

/**
 * Lock the Stock row for this product/warehouse with SELECT FOR UPDATE.
 * Must be called inside a Prisma interactive transaction.
 * Returns the locked row, or null if it doesn't exist.
 */
export async function lockStockRow(
  tx: TransactionClient,
  productId: string,
  warehouseId: string
): Promise<{ id: string; total: number; reserved: number } | null> {
  const rows = await tx.$queryRaw<
    { id: string; total: number; reserved: number }[]
  >`
    SELECT id, total, reserved
    FROM "Stock"
    WHERE "productId"   = ${productId}
      AND "warehouseId" = ${warehouseId}
    FOR UPDATE
  `;
  return rows[0] ?? null;
}

/** Increment reserved count atomically (inside a transaction). */
export async function incrementReserved(
  tx: TransactionClient,
  stockId: string,
  quantity: number
): Promise<void> {
  await tx.$executeRaw`
    UPDATE "Stock"
    SET reserved = reserved + ${quantity}
    WHERE id = ${stockId}
  `;
}

/** Decrement reserved count atomically (inside a transaction). */
export async function decrementReserved(
  tx: TransactionClient,
  productId: string,
  warehouseId: string,
  quantity: number
): Promise<void> {
  await tx.$executeRaw`
    UPDATE "Stock"
    SET reserved = GREATEST(reserved - ${quantity}, 0)
    WHERE "productId"   = ${productId}
      AND "warehouseId" = ${warehouseId}
  `;
}

/**
 * On confirmation: remove from both reserved and total
 * (the units are permanently consumed).
 */
export async function consumeStock(
  tx: TransactionClient,
  productId: string,
  warehouseId: string,
  quantity: number
): Promise<void> {
  await tx.$executeRaw`
    UPDATE "Stock"
    SET reserved = GREATEST(reserved - ${quantity}, 0),
        total    = GREATEST(total    - ${quantity}, 0)
    WHERE "productId"   = ${productId}
      AND "warehouseId" = ${warehouseId}
  `;
}

export async function findReservationById(
  tx: TransactionClient,
  id: string
): Promise<Reservation | null> {
  return tx.reservation.findUnique({ where: { id } });
}
