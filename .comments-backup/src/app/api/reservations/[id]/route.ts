import { NextRequest, NextResponse } from "next/server";
import { getReservation } from "@/lib/services/reservation.service";
import { handleApiError, serializeReservation } from "@/lib/api-utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reservation = await getReservation(params.id);
    return NextResponse.json(serializeReservation(reservation));
  } catch (err) {
    return handleApiError(err);
  }
}
