import { useQuery } from "@tanstack/react-query";
import { getSmsDisponibilAction } from "@/lib/actions/sms-disponibil";

/** Cheie comună: widget, banner, Remindere, dialogul de trimitere în masă. */
export const SMS_DISPONIBIL_KEY = ["sms-disponibil"] as const;

/**
 * SMS-urile proprietarului stației curente (incluse + credit) — o singură cerere,
 * partajată de toate componentele. gcTime 0: la logout / schimbarea contului
 * (impersonare) toți consumatorii se demontează și datele dispar, ca alt cont
 * de pe același dispozitiv să nu vadă soldul precedent (cheia nu conține id-ul).
 */
export function useSmsDisponibil(options?: { enabled?: boolean; staleTime?: number }) {
  return useQuery({
    queryKey: SMS_DISPONIBIL_KEY,
    queryFn: () => getSmsDisponibilAction(),
    gcTime: 0,
    enabled: options?.enabled ?? true,
    ...(options?.staleTime !== undefined ? { staleTime: options.staleTime } : {}),
  });
}
