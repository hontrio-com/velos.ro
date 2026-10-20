"use client";

import { useEffect } from "react";
import { CumparaSmsModal } from "@/components/sms/cumpara-sms-modal";
import { useCumparaSmsStore } from "@/stores/cumpara-sms-store";

/** Instanța comună a modalului de cumpărare SMS. Montată doar pentru proprietari. */
export function CumparaSmsHost() {
  const deschis = useCumparaSmsStore((s) => s.deschis);
  const inchide = useCumparaSmsStore((s) => s.inchide);
  const setDisponibil = useCumparaSmsStore((s) => s.setDisponibil);

  useEffect(() => {
    setDisponibil(true);
    return () => setDisponibil(false);
  }, [setDisponibil]);

  return <CumparaSmsModal open={deschis} onClose={inchide} />;
}
