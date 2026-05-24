import { NextRequest, NextResponse } from "next/server";
import { confirmReservation } from "@/lib/services/reservation.service";
import { withIdempotency } from "@/lib/services/idempotency.service";
import { handleApiError, serializeReservation } from "@/lib/api-utils";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const idempotencyKey = req.headers.get("idempotency-key");

    const execute = async () => {
      const reservation = await confirmReservation(id);
      return { status: 200, body: serializeReservation(reservation) };
    };

    if (idempotencyKey) {
      const result = await withIdempotency(idempotencyKey, execute);
      return NextResponse.json(result.body, { status: result.status });
    }

    const result = await execute();
    return NextResponse.json(result.body, { status: result.status });
  } catch (err) {
    return handleApiError(err);
  }
}
