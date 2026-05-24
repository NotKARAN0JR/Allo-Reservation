import { getReservation } from "@/lib/services/reservation.service";
import { ReservationNotFoundError } from "@/lib/errors/http.errors";
import { notFound } from "next/navigation";
import { ReservationView } from "@/components/ReservationView";
import { serializeReservation } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

export default async function ReservationPage({
  params,
}: {
  params: { id: string };
}) {
  try {
    const reservation = await getReservation(params.id);
    return <ReservationView initial={serializeReservation(reservation)} />;
  } catch (err) {
    if (err instanceof ReservationNotFoundError) notFound();
    throw err;
  }
}
