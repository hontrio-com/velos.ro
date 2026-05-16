// Shared types and constants for the angajati module.
// Importable from both server and client components.

export interface Angajat {
  id: string;
  statie_id: string;
  profile_id: string | null;
  nume: string;
  functie: string | null;
  telefon: string | null;
  email: string | null;
  activ: boolean;
  permisiuni: Permisiuni | null;
  created_at: string;
}

export type Permisiuni = {
  programari: boolean;
  clienti: boolean;
  vehicule: boolean;
  rapoarte: boolean;
  remindere: boolean;
};

export const DEFAULT_PERMISIUNI: Permisiuni = {
  programari: true,
  clienti: true,
  vehicule: false,
  rapoarte: false,
  remindere: false,
};

export type ActionResult<T = undefined> =
  | (T extends undefined ? { success: true } : { success: true; data: T })
  | { success: false; error: string };
