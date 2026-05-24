import type { Reservation } from "@prisma/client";


export type CreateReservationBody = {
  productId: string;
  warehouseId: string;
  quantity: number;
};


export type ReservationResponse = Omit<Reservation, "expiresAt" | "createdAt" | "updatedAt"> & {
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
};

export type ApiError = {
  error: string;
};
