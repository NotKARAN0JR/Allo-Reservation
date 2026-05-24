export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { expireStaleReservations } from "@/lib/services/reservation.service";


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
