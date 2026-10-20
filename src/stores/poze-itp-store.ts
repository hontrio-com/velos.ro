import { create } from "zustand";
import type { PozaComprimata } from "@/lib/imagini";

/**
 * Încărcările de poze ITP în curs, pe programare (cheia = programareId).
 * Stau în afara componentelor ca să supraviețuiască închiderii sertarului
 * (secțiunea se demontează, încărcarea continuă) și ca o încărcare pornită pe
 * programarea A să nu apară pe programarea B. Store-ul nu se persistă (conține
 * Blob-uri); copia durabilă a pozelor neîncărcate stă în IndexedDB
 * (lib/poze-itp/persistenta.ts), gestionată de lib/poze-itp/client.ts.
 */

export type StareIncarcare = "coada" | "comprimare" | "incarcare" | "salvare" | "eroare";

export interface IncarcarePoza {
  id: string;
  stare: StareIncarcare;
  /** 0..1 — relevant doar în starea „incarcare”. */
  progres: number;
  /** Object URL al pozei comprimate (previzualizare locală). */
  previewUrl: string | null;
  eroare: string | null;
  /** Fișierul original, până la comprimare. */
  fisier: File | null;
  /** Rezultatul comprimării — păstrat pentru „Reîncearcă” (o poză din cameră nu există altundeva). */
  imagine: PozaComprimata | null;
  /**
   * Cheile din R2 după un PUT reușit. Dacă doar confirmarea a eșuat (rețea),
   * „Reîncearcă” reia doar confirmarea (idempotentă) — fără o a doua încărcare.
   */
  urcata: { cheie: string; cheieThumb: string | null } | null;
  /**
   * Eroarea poate dispărea la o nouă încercare (rețea, URL expirat cât telefonul a
   * stat blocat, confirmare neverificată): se reia singură la revenirea în aplicație.
   */
  tranzitorie?: boolean;
  /** Server Action necunoscută (aplicația a fost actualizată): ajută doar reîncărcarea paginii. */
  actualizareAplicatie?: boolean;
  /**
   * Reluări automate la rând ale unei poze fără chei: fiecare cere URL-uri noi, deci rezervă din
   * nou octeții din plafonul zilnic al proprietarului. Limitate; un PUT reușit sau „Reîncearcă” le resetează.
   */
  reluariAutomate?: number;
}

interface PozeItpState {
  incarcari: Record<string, IncarcarePoza[]>;
  adauga: (programareId: string, lista: IncarcarePoza[]) => void;
  actualizeaza: (programareId: string, id: string, modificari: Partial<IncarcarePoza>) => void;
  elimina: (programareId: string, ids: string[]) => void;
}

/** Referință stabilă pentru selectorii fără încărcări (evită re-randări infinite). */
export const FARA_INCARCARI: IncarcarePoza[] = [];

export const usePozeItpStore = create<PozeItpState>()((set, get) => ({
  incarcari: {},

  adauga: (programareId, lista) =>
    set((s) => ({
      incarcari: { ...s.incarcari, [programareId]: [...(s.incarcari[programareId] ?? []), ...lista] },
    })),

  actualizeaza: (programareId, id, modificari) =>
    set((s) => {
      const lista = s.incarcari[programareId];
      if (!lista) return s;
      return {
        incarcari: {
          ...s.incarcari,
          [programareId]: lista.map((i) => (i.id === id ? { ...i, ...modificari } : i)),
        },
      };
    }),

  elimina: (programareId, ids) => {
    const deEliminat = new Set(ids);
    for (const i of get().incarcari[programareId] ?? []) {
      if (deEliminat.has(i.id) && i.previewUrl) URL.revokeObjectURL(i.previewUrl);
    }
    set((s) => {
      const ramase = (s.incarcari[programareId] ?? []).filter((i) => !deEliminat.has(i.id));
      const incarcari = { ...s.incarcari };
      if (ramase.length) incarcari[programareId] = ramase;
      else delete incarcari[programareId];
      return { incarcari };
    });
  },
}));
