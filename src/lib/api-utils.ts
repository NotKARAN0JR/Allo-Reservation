import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "@/lib/errors/http.errors";
import type { Reservation } from "@prisma/client";
import type { ReservationResponse } from "@/types/api.types";

export function handleApiError(err: unknown): NextResponse {
  if (err instanceof AppError) {
    return NextResponse.json({ error: err.message }, { status: err.statusCode });
  }
  if (err instanceof ZodError) {
    return NextResponse.json(
      { error: "Validation error", details: err.flatten() },
      { status: 400 }
    );
  }
  console.error("[API Error]", err);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export function serializeReservation(r: Reservation): ReservationResponse {
  return {
    ...r,
    expiresAt: r.expiresAt.toISOString(),
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  } as ReservationResponse;
}
