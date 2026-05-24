import { prisma } from "@/lib/db/prisma";
import type { ProductWithAvailability } from "@/types/domain.types";

export async function findAllProductsWithAvailability(): Promise<ProductWithAvailability[]> {
  const products = await prisma.product.findMany({
    include: {
      stocks: {
        include: { warehouse: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price.toString(),
    imageUrl: p.imageUrl,
    createdAt: p.createdAt.toISOString(),
    availability: p.stocks.map((s) => ({
      warehouseId: s.warehouseId,
      warehouseName: s.warehouse.name,
      warehouseLocation: s.warehouse.location,
      total: s.total,
      reserved: s.reserved,
      available: s.total - s.reserved,
    })),
  }));
}
