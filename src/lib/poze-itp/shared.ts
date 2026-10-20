/**
 * Constante, tipuri și utilitare pentru pozele ITP — fără dependențe de server,
 * deci pot fi importate și din componente client. Limitele sunt verificate DIN NOU
 * pe server (lib/actions/poze-itp.ts) și, pentru mărime, în baza de date (migrația 013).
 */

/** Câte poze se pot pregăti / confirma într-un singur apel de server action. */
export const POZE_MAX_PE_APEL = 20;
/** Câte poze active (neșterse, neexpirate) poate avea o programare. */
export const POZE_MAX_ACTIVE = 40;
/** Mărimea maximă a unei poze după comprimare (identică cu CHECK-ul din SQL). */
export const POZA_MAX_BYTES = 8 * 1024 * 1024;
/** Mărimea maximă a miniaturii. */
export const POZA_THUMB_MAX_BYTES = 1024 * 1024;
/**
 * Plafonul zilnic de încărcare per proprietarul stației: octeții (poze + miniaturi)
 * semnați în URL-urile de încărcare emise într-o zi. Se rezervă atomic în SQL
 * (rezerva_incarcare_poze) înainte de emiterea URL-urilor, deci se numără și
 * încărcările niciodată confirmate.
 */
export const POZE_PLAFON_ZILNIC_OCTETI = 2 * 1024 ** 3;
/** Retenția implicită (DEFAULT-ul coloanei expira_la din SQL). */
export const POZE_RETENTIE_ZILE = 14;
/** Eroarea lui pregatesteDescarcarePozeAction când programarea nu mai are nicio poză activă. */
export const MESAJ_FARA_POZE_DE_DESCARCAT = "Nu există poze de descărcat.";

/** Comprimare în browser: latura maximă și calitatea JPEG. */
export const POZA_LATURA_MAX = 2000;
export const POZA_CALITATE = 0.8;
export const THUMB_LATURA_MAX = 480;
export const THUMB_CALITATE = 0.7;

/** Query key TanStack pentru lista de poze a unei programări. */
export function cheiePozeProgramare(programareId: string) {
  return ["programare-poze", programareId] as const;
}

export type MotivStergere = "descarcat" | "expirat" | "manual";

export interface PozaItp {
  id: string;
  /** URL GET presemnat (miniatura, sau poza mare dacă miniatura lipsește). */
  urlThumb: string;
  /** URL GET presemnat pentru poza mare. */
  urlFull: string;
  /** Momentul fotografierii raportat de telefon (validat pe server) — poate lipsi. */
  facutaLa: string | null;
  incarcataLa: string;
  expiraLa: string;
  latime: number | null;
  inaltime: number | null;
  marime: number;
  /** Numele celui care a încărcat poza (profiles.full_name) sau null. */
  incarcataDe: string | null;
}

export interface RezumatPozeSterse {
  motiv: MotivStergere;
  numar: number;
  /** Cea mai recentă ștergere din grup (ISO). */
  ultimaLa: string;
  /** Cine a făcut ultima ștergere din grup (doar numele afișat, fără email). */
  deNume: string | null;
}

export type ListaPozeRezultat =
  | { configurat: false }
  | {
      configurat: true;
      poze: PozaItp[];
      sterse: RezumatPozeSterse[];
      /** Admin impersonat: nimic nu se șterge (nici după descărcare, nici manual). */
      modAdmin: boolean;
    };

export interface EroareLista {
  error: string;
  /** true = fără drept de acces (reîncercarea nu ajută). */
  faraAcces: boolean;
}

export interface FisierDeIncarcat {
  mime: "image/jpeg";
  marime: number;
  marimeThumb: number | null;
}

export interface IncarcarePregatita {
  cheie: string;
  cheieThumb: string | null;
  urlPut: string;
  urlPutThumb: string | null;
}

export interface PozaIncarcata {
  cheie: string;
  cheieThumb: string | null;
  /** file.lastModified (ms) — serverul îl păstrează doar dacă e plauzibil. */
  facutaLa: number | null;
  latime: number | null;
  inaltime: number | null;
}

export interface RezultatConfirmare {
  /** Chei salvate (inclusiv cele salvate deja de o confirmare anterioară). */
  confirmate: string[];
  /** Chei respinse definitiv, cu motivul. O reîncercare le urcă din nou, cu chei noi. */
  respinse: { cheie: string; motiv: string }[];
  /** Chei care nu au putut fi verificate acum (R2 indisponibil) — se pot reconfirma. */
  reincearca: string[];
}

export interface PozaDeDescarcat {
  id: string;
  url: string;
  /** Numele fișierului în arhivă: ITP_<NR>_<YYYY-MM-DD>_<HH-mm>_<nn>.jpg (ora României). */
  nume: string;
  marime: number;
  /** ISO — data folosită ca „lastModified” în arhivă. */
  data: string;
}

export interface DescarcarePregatita {
  poze: PozaDeDescarcat[];
  /** ITP_<NR>_<data programării>_<HH-mm-ss>.zip — ora pregătirii, deci alt nume la fiecare descărcare. */
  numeArhiva: string;
  stergeDupaDescarcare: boolean;
}

/** „1 poză”, „3 poze”, „20 de poze” (regula lui „de” din română). */
export function formatPoze(n: number): string {
  if (n === 1) return "1 poză";
  const rest = n % 100;
  const cuDe = n !== 0 && (rest === 0 || rest >= 20);
  return `${n} ${cuDe ? "de " : ""}poze`;
}

/** „850 KB”, „12,4 MB”. */
export function formatMarime(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toLocaleString("ro-RO", { maximumFractionDigits: 1 })} MB`;
}
