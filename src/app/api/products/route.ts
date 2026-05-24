export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;
import { NextResponse } from "next/server";
import { findAllProductsWithAvailability } from "@/lib/repositories/product.repository";
import { handleApiError } from "@/lib/api-utils";

export async function GET() {
  try {
    const products = await findAllProductsWithAvailability();
    return NextResponse.json(products);
  } catch (err) {
    return handleApiError(err);
  }
}
