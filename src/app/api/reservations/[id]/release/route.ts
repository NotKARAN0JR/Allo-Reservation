import { NextRequest, NextResponse } from "next/server";
import { releaseReservation } from "@/lib/services/reservation.service";
import { handleApiError, serializeReservation } from "@/lib/api-utils";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reservation = await releaseReservation(params.id);
    return NextResponse.json(serializeReservation(reservation));
  } catch (err) {
    return handleApiError(err);
  }
}
