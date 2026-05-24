"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { StockBadge } from "./StockBadge";
import type { ProductWithAvailability, StockAvailability } from "@/types/domain.types";

interface ProductCardProps {
  product: ProductWithAvailability;
}

export function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const [loadingWarehouse, setLoadingWarehouse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const price = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(product.price));

  async function handleReserve(stock: StockAvailability) {
    setLoadingWarehouse(stock.warehouseId);
    setError(null);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          warehouseId: stock.warehouseId,
          quantity: 1,
        }),
      });

      const data = await res.json();

      if (res.status === 409) {
        setError(data.error ?? "Not enough stock available.");
        return;
      }
      if (!res.ok) {
        setError("Something went wrong. Please try again.");
        return;
      }

      router.push(`/reservations/${data.id}`);
    } finally {
      setLoadingWarehouse(null);
    }
  }

  return (
    <div className="app-card flex flex-col transition-transform transform hover:-translate-y-1">
      {}
      <div className="p-6 flex-1">
        <h2 className="font-semibold text-lg leading-tight">{product.name}</h2>
        {product.description && (
          <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
            {product.description}
          </p>
        )}
        <p className="font-bold text-lg mt-3">{price}</p>
      </div>

      {}
      <div className="border-t">
        {product.availability.map((stock) => (
          <div key={stock.warehouseId} className="flex items-center justify-between px-6 py-3 border-b last:border-b-0">
            <div className="min-w-0 mr-3">
              <p className="text-sm font-medium truncate">{stock.warehouseName}</p>
              <p className="text-xs text-muted-foreground truncate">{stock.warehouseLocation}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <StockBadge available={stock.available} />
              <button
                onClick={() => handleReserve(stock)}
                disabled={stock.available === 0 || loadingWarehouse === stock.warehouseId}
                className="text-sm font-medium px-3 py-1.5 rounded-md bg-black text-white hover:bg-black/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {loadingWarehouse === stock.warehouseId ? "Reserving…" : "Reserve"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {}
      {error && (
        <div className="px-5 py-3 bg-destructive/5 border-t text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}
