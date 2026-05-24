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

  const classes = cn("inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium shadow-sm", className);
  if (available === 0) {
    return (
      <span className={classes} style={{ background: 'var(--status-out-bg)', color: 'var(--status-out-text)' }}>
        {label}
      </span>
    );
  }
  if (available <= 2) {
    return (
      <span className={classes} style={{ background: 'var(--status-low-bg)', color: 'var(--status-low-text)' }}>
        {label}
      </span>
    );
  }
  return (
    <span className={classes} style={{ background: 'var(--status-available-bg)', color: 'var(--status-available-text)' }}>
      {label}
    </span>
  );
}
