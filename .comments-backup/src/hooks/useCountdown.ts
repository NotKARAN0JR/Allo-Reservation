"use client";
import { useState, useEffect } from "react";

export function useCountdown(expiresAt: string): number {
  const getSecondsLeft = () =>
    Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));

  const [secondsLeft, setSecondsLeft] = useState(getSecondsLeft);

  useEffect(() => {
    // Re-sync on mount (handles server/client time skew)
    setSecondsLeft(getSecondsLeft());

    if (getSecondsLeft() <= 0) return;

    const interval = setInterval(() => {
      const remaining = getSecondsLeft();
      setSecondsLeft(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt]);

  return secondsLeft;
}
