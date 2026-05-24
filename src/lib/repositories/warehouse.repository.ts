import { prisma } from "@/lib/db/prisma";
import type { Warehouse } from "@prisma/client";

export async function findAllWarehouses(): Promise<Warehouse[]> {
  return prisma.warehouse.findMany({ orderBy: { name: "asc" } });
}
