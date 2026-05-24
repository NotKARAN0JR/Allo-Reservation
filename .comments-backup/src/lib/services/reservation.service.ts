import { prisma } from "@/lib/db/prisma";
import { ReservationStatus, type Reservation } from "@prisma/client";
import { addMinutes } from "date-fns";
import {
  StockUnavailableError,
  ReservationExpiredError,
  ReservationNotFoundError,
} from "@/lib/errors/http.errors";
import {
  lockStockRow,
  incrementReserved,
  decrementReserved,
  consumeStock,
  findReservationById,
} from "@/lib/repositories/reservation.repository";

const WINDOW = parseInt(process.env.RESERVATION_WINDOW_MINUTES ?? "10", 10);

// ── Create ────────────────────────────────────────────────────────────────────

/**
 * Reserve `quantity` units of a product at a warehouse.
 *
 * Concurrency guarantee:
 *   The Stock row is locked with SELECT FOR UPDATE before reading the available
 *   count. Two simultaneous requests for the last unit will serialize here —
 *   the second will wait for the first's transaction to commit, then re-read
 *   the (now-decremented) count and receive a 409.
 */
export async function createReservation(
  productId: string,
  warehouseId: string,
  quantity: number
): Promise<Reservation> {
  return prisma.$transaction(async (tx) => {
    // 1. Acquire exclusive row lock
    const stock = await lockStockRow(tx, productId, warehouseId);

    if (!stock) {
      throw new StockUnavailableError("Product is not stocked in this warehouse");
    }

    const available = stock.total - stock.reserved;

    if (available < quantity) {
      throw new StockUnavailableError(
        `Only ${available} unit${available === 1 ? "" : "s"} available — requested ${quantity}`
      );
    }

    // 2. Atomically increment reserved
    await incrementReserved(tx, stock.id, quantity);

    // 3. Create the reservation record
    const reservation = await tx.reservation.create({
      data: {
        productId,
        warehouseId,
        quantity,
        status: ReservationStatus.PENDING,
        expiresAt: addMinutes(new Date(), WINDOW),
      },
    });

    return reservation;
  });
}

// ── Confirm ───────────────────────────────────────────────────────────────────

/**
 * Confirm a reservation (payment succeeded).
 * Returns 410 if the reservation has expired.
 * Lazy expiry: if the reservation window has passed we release it here and throw.
 */
export async function confirmReservation(id: string): Promise<Reservation> {
  return prisma.$transaction(async (tx) => {
    const reservation = await findReservationById(tx, id);

    if (!reservation) {
      throw new ReservationNotFoundError(id);
    }

    if (reservation.status === ReservationStatus.CONFIRMED) {
      return reservation; // idempotent
    }

    if (
      reservation.status === ReservationStatus.RELEASED ||
      reservation.expiresAt < new Date()
    ) {
      // Lazy cleanup: release the hold if it hasn't been released yet
      if (reservation.status === ReservationStatus.PENDING) {
        await decrementReserved(
          tx,
          reservation.productId,
          reservation.warehouseId,
          reservation.quantity
        );
        await tx.reservation.update({
          where: { id },
          data: { status: ReservationStatus.RELEASED },
        });
      }
      throw new ReservationExpiredError();
    }

    // Permanently consume the stock
    await consumeStock(
      tx,
      reservation.productId,
      reservation.warehouseId,
      reservation.quantity
    );

    return tx.reservation.update({
      where: { id },
      data: { status: ReservationStatus.CONFIRMED },
    });
  });
}

// ── Release ───────────────────────────────────────────────────────────────────

/**
 * Release a reservation early (user cancelled or payment failed).
 * Idempotent — safe to call on an already-released reservation.
 */
export async function releaseReservation(id: string): Promise<Reservation> {
  return prisma.$transaction(async (tx) => {
    const reservation = await findReservationById(tx, id);

    if (!reservation) {
      throw new ReservationNotFoundError(id);
    }

    // Already in a terminal state — return as-is (idempotent)
    if (reservation.status !== ReservationStatus.PENDING) {
      return reservation;
    }

    await decrementReserved(
      tx,
      reservation.productId,
      reservation.warehouseId,
      reservation.quantity
    );

    return tx.reservation.update({
      where: { id },
      data: { status: ReservationStatus.RELEASED },
    });
  });
}

// ── Get ───────────────────────────────────────────────────────────────────────

export async function getReservation(id: string): Promise<Reservation> {
  const reservation = await prisma.reservation.findUnique({ where: { id } });

  if (!reservation) throw new ReservationNotFoundError(id);

  // Lazy expiry check on read
  if (
    reservation.status === ReservationStatus.PENDING &&
    reservation.expiresAt < new Date()
  ) {
    return prisma.$transaction(async (tx) => {
      await decrementReserved(
        tx,
        reservation.productId,
        reservation.warehouseId,
        reservation.quantity
      );
      return tx.reservation.update({
        where: { id },
        data: { status: ReservationStatus.RELEASED },
      });
    });
  }

  return reservation;
}

// ── Batch expiry (called by cron) ─────────────────────────────────────────────

export async function expireStaleReservations(): Promise<number> {
  const expired = await prisma.reservation.findMany({
    where: {
      status: ReservationStatus.PENDING,
      expiresAt: { lt: new Date() },
    },
  });

  let released = 0;
  for (const r of expired) {
    try {
      await prisma.$transaction(async (tx) => {
        await decrementReserved(tx, r.productId, r.warehouseId, r.quantity);
        await tx.reservation.update({
          where: { id: r.id },
          data: { status: ReservationStatus.RELEASED },
        });
      });
      released++;
    } catch (err) {
      // Log and continue — don't let one bad row abort the batch
      console.error(`[expiry] Failed to release reservation ${r.id}:`, err);
    }
  }

  return released;
}
