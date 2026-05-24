import { cn } from "@/lib/utils";

interface StockBadgeProps {
  available: number;
  className?: string;
}

export function StockBadge({ available, className }: StockBadgeProps) {
  const label =
    available === 0
      ? "Out of stock"
      : available === 1
      ? "1 left"
      : `${available} available`;

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
        available === 0
          ? "bg-destructive/10 text-destructive"
          : available <= 2
          ? "bg-orange-50 text-orange-700"
          : "bg-green-50 text-green-700",
        className
      )}
    >
      {label}
    </span>
  );
}
