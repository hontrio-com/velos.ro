import { toast } from "sonner";
import { useCumparaSmsStore } from "@/stores/cumpara-sms-store";

interface RezultatSms {
  error?: string;
  quotaDepasita?: boolean;
  trialFaraSms?: boolean;
}

/**
 * Afișează eroarea unei trimiteri de SMS. Pentru contul fără SMS incluse
 * (trialul nou) rămas fără credit oferă direct „Cumpără SMS-uri" (doar
 * proprietarului; angajatul, care nu poate cumpăra, vede un titlu despre stație).
 * Pentru celelalte conturi toast-ul rămâne exact cel de azi.
 *
 * @returns true pentru cazul „fără SMS incluse și fără credit" — apelantul își
 *          poate închide dialogul, ca modalul de cumpărare să nu fie acoperit.
 */
export function afiseazaEroareSms(rezultat: RezultatSms, mesajImplicit: string): boolean {
  if (!rezultat.quotaDepasita || !rezultat.trialFaraSms) {
    toast.error(rezultat.error ?? mesajImplicit);
    return false;
  }

  const mesaj = rezultat.error ?? mesajImplicit;
  const { disponibil, deschide } = useCumparaSmsStore.getState();
  if (disponibil) {
    toast.error(mesaj, {
      duration: 10_000,
      action: { label: "Cumpără SMS-uri", onClick: () => deschide() },
    });
  } else {
    // Textul serverului îi cere să cumpere credite — angajatul nu poate.
    toast.error("Stația nu are credit SMS.", {
      description: "Roagă proprietarul stației să cumpere credite SMS.",
      duration: 10_000,
    });
  }
  return true;
}
