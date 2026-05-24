"use client";
import { useRouter } from "next/navigation";
import { CountdownTimer } from "./CountdownTimer";
import { useReservation } from "@/hooks/useReservation";
import type { ReservationResponse } from "@/types/api.types";

interface ReservationViewProps {
  initial: ReservationResponse;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING:   { label: "Reserved — awaiting payment", color: "text-orange-600 bg-orange-50" },
  CONFIRMED: { label: "Confirmed",                   color: "text-green-700 bg-green-50"  },
  RELEASED:  { label: "Cancelled / Expired",         color: "text-muted-foreground bg-muted" },
};

export function ReservationView({ initial }: ReservationViewProps) {
  const router = useRouter();
  const { reservation, confirm, release, isActing, actionError } = useReservation(initial);

  const status = STATUS_LABELS[reservation.status] ?? STATUS_LABELS.RELEASED;
  const isPending = reservation.status === "PENDING";
  const isExpired = isPending && new Date(reservation.expiresAt) < new Date();

  return (
    <div className="max-w-lg mx-auto">
      <button
        onClick={() => router.push("/products")}
        className="text-sm text-muted-foreground hover:text-foreground mb-6 flex items-center gap-1"
      >
        ← Back to products
      </button>

      <div className="app-card">
        {}
        <div className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-semibold text-lg">Checkout</h1>
              <p className="text-muted-foreground text-sm font-mono mt-0.5">
                #{reservation.id.slice(-8).toUpperCase()}
              </p>
            </div>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${status.color}`}>
              {status.label}
            </span>
          </div>
        </div>

        {}
        <div className="px-6 py-6 space-y-4">
          <Detail label="Quantity" value={`${reservation.quantity} unit${reservation.quantity !== 1 ? "s" : ""}`} />
          <Detail label="Warehouse" value={reservation.warehouseId} mono />
          <Detail label="Reserved at" value={new Date(reservation.createdAt).toLocaleString()} />

          {isPending && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Time remaining</span>
              <CountdownTimer expiresAt={reservation.expiresAt} />
            </div>
          )}
        </div>

        {}
        {actionError && (
          <div className="mx-6 mb-4 px-4 py-3 rounded-md bg-destructive/8 border border-destructive/20 text-sm text-destructive">
            {actionError}
          </div>
        )}

        {}
        {isPending && !isExpired && (
          <div className="px-6 pb-6 flex gap-3">
            <button
              onClick={confirm}
              disabled={isActing}
              className="flex-1 py-2.5 rounded-md bg-black text-white text-sm font-medium hover:bg-black/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isActing ? "Processing…" : "Confirm purchase"}
            </button>
            <button
              onClick={release}
              disabled={isActing}
              className="px-4 py-2.5 rounded-md border text-sm font-medium hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {reservation.status === "CONFIRMED" && (
          <div className="px-6 pb-6">
            <div className="w-full py-2.5 rounded-md bg-green-50 text-green-700 text-sm font-medium text-center">
              ✓ Order confirmed — thank you!
            </div>
          </div>
        )}

        {(reservation.status === "RELEASED" || isExpired) && (
          <div className="px-6 pb-6 space-y-3">
            <div className="w-full py-2.5 rounded-md bg-muted text-muted-foreground text-sm font-medium text-center">
              {isExpired ? "This reservation has expired" : "This reservation was cancelled"}
            </div>
            <button
              onClick={() => router.push("/products")}
              className="w-full py-2.5 rounded-md border text-sm font-medium hover:bg-muted transition-colors"
            >
              Browse products
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}
