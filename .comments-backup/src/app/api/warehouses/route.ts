import { NextResponse } from "next/server";
import { findAllWarehouses } from "@/lib/repositories/warehouse.repository";
import { handleApiError } from "@/lib/api-utils";

export async function GET() {
  try {
    const warehouses = await findAllWarehouses();
    return NextResponse.json(warehouses);
  } catch (err) {
    return handleApiError(err);
  }
}
