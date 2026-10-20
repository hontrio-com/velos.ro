import { create } from "zustand";

// Deschide modalul „Cumpără SMS-uri" de oriunde (toast, banner, dialog) fără a
// monta câte o copie în fiecare componentă. Host-ul (CumparaSmsHost) e montat
// doar pentru proprietari, în DashboardShell: `disponibil` spune dacă
// utilizatorul curent poate cumpăra (angajații nu pot — SMS-urile se consumă
// din contul proprietarului; /api/stripe/checkout le întoarce 403).

interface CumparaSmsStore {
  disponibil: boolean;
  deschis: boolean;
  setDisponibil: (disponibil: boolean) => void;
  deschide: () => void;
  inchide: () => void;
}

export const useCumparaSmsStore = create<CumparaSmsStore>()((set, get) => ({
  disponibil: false,
  deschis: false,
  setDisponibil: (disponibil) => set(disponibil ? { disponibil } : { disponibil, deschis: false }),
  deschide: () => {
    if (get().disponibil) set({ deschis: true });
  },
  inchide: () => set({ deschis: false }),
}));
