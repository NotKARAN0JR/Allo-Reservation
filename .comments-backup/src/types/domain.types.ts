import type { Product, Warehouse, Stock, Reservation, ReservationStatus } from "@prisma/client";

export type { ReservationStatus };

export type StockWithWarehouse = Stock & {
  warehouse: Warehouse;
};

export type ProductWithStock = Product & {
  stocks: StockWithWarehouse[];
};

export type ReservationWithProduct = Reservation & {
  product?: Product;
};

/** Computed available units = total - reserved */
export type StockAvailability = {
  warehouseId: string;
  warehouseName: string;
  warehouseLocation: string;
  total: number;
  reserved: number;
  available: number;
};

export type ProductWithAvailability = {
  id: string;
  name: string;
  description: string | null;
  price: string; // serialised Decimal → string for JSON safety
  imageUrl: string | null;
  createdAt: string;
  availability: StockAvailability[];
};
