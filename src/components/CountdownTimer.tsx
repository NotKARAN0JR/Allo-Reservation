"use client";
import { useCountdown } from "@/hooks/useCountdown";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  expiresAt: string;
  className?: string;
}

export function CountdownTimer({ expiresAt, className }: CountdownTimerProps) {
  const secondsLeft = useCountdown(expiresAt);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const isUrgent = secondsLeft <= 60;
  const isExpired = secondsLeft === 0;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-md font-mono text-sm font-medium",
        isExpired
          ? "bg-destructive/10 text-destructive"
          : isUrgent
          ? "bg-orange-50 text-orange-600 animate-pulse"
          : "bg-muted text-foreground",
        className
      )}
    >
      <span className="w-2 h-2 rounded-full bg-current opacity-75" />
      {isExpired ? "Expired" : formatted}
    </div>
  );
}
