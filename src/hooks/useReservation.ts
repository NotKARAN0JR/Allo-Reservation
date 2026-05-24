"use client";
import { useState } from "react";
import useSWR from "swr";
import type { ReservationResponse } from "@/types/api.types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useReservation(initialData: ReservationResponse) {
  const [actionError, setActionError] = useState<string | null>(null);
  const [isActing, setIsActing] = useState(false);

  const { data, mutate } = useSWR<ReservationResponse>(
    `/api/reservations/${initialData.id}`,
    fetcher,
    {
      fallbackData: initialData,
      // Only poll while still pending and not expired
      refreshInterval: (data) => {
        if (!data || data.status !== "PENDING") return 0;
        const expired = new Date(data.expiresAt) < new Date();
        return expired ? 0 : 30_000; // poll every 30s
      },
      revalidateOnFocus: true,
    }
  );

  const reservation = data ?? initialData;

  async function confirm() {
    setIsActing(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/reservations/${reservation.id}/confirm`, {
        method: "POST",
      });
      const json = await res.json();
      if (res.status === 410) {
        setActionError("This reservation has expired. Please start a new checkout.");
        mutate();
        return;
      }
      if (!res.ok) {
        setActionError(json.error ?? "Something went wrong");
        return;
      }
      mutate(json, { revalidate: false });
    } finally {
      setIsActing(false);
    }
  }

  async function release() {
    setIsActing(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/reservations/${reservation.id}/release`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) {
        setActionError(json.error ?? "Something went wrong");
        return;
      }
      mutate(json, { revalidate: false });
    } finally {
      setIsActing(false);
    }
  }

  return { reservation, confirm, release, isActing, actionError };
}
