export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = "AppError";
  }
}

/** HTTP 409 — not enough stock available */
export class StockUnavailableError extends AppError {
  constructor(message = "Insufficient stock available") {
    super(message, 409);
    this.name = "StockUnavailableError";
  }
}

/** HTTP 410 — reservation window has passed */
export class ReservationExpiredError extends AppError {
  constructor(message = "Reservation has expired") {
    super(message, 410);
    this.name = "ReservationExpiredError";
  }
}

/** HTTP 404 — reservation not found */
export class ReservationNotFoundError extends AppError {
  constructor(id: string) {
    super(`Reservation ${id} not found`, 404);
    this.name = "ReservationNotFoundError";
  }
}
