import { NextRequest, NextResponse } from "next/server";
import { CreateReservationSchema } from "@/schemas/reservation.schema";
import { createReservation } from "@/lib/services/reservation.service";
import { withIdempotency } from "@/lib/services/idempotency.service";
import { handleApiError, serializeReservation } from "@/lib/api-utils";

export async function POST(req: NextRequest) {
  try {
    const body = CreateReservationSchema.parse(await req.json());
    const idempotencyKey = req.headers.get("idempotency-key");

    const execute = async () => {
      const reservation = await createReservation(
        body.productId,
        body.warehouseId,
        body.quantity
      );
      return { status: 201, body: serializeReservation(reservation) };
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
