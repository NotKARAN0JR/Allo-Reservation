import { NextRequest, NextResponse } from "next/server";
import { expireStaleReservations } from "@/lib/services/reservation.service";

/**
 * Called by Vercel Cron every minute (see vercel.json).
 * Finds all PENDING reservations past their expiresAt and releases them.
 *
 * Protected by CRON_SECRET so it can't be triggered by arbitrary callers.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;

  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const released = await expireStaleReservations();

  console.log(`[cron] Released ${released} expired reservation(s)`);

  return NextResponse.json({ released, timestamp: new Date().toISOString() });
}
