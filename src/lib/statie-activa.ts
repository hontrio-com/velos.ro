import { cookies } from "next/headers";

/**
 * Statia activa pentru un proprietar cu mai multe statii.
 *
 * Selectia era pastrata doar in localStorage (zustand), pe care serverul nu-l vede:
 * comutatorul din bara laterala schimba doar eticheta, iar toate paginile continuau
 * sa afiseze prima statie. Selectia se tine acum intr-un cookie, citit la fiecare
 * cerere de `getStatieForUser()`, si este validata de fiecare data (proprietarul
 * trebuie sa detina statia ceruta).
 */

export const COOKIE_STATIE_ACTIVA = "itp_statie_activa";

const OPTIUNI_COOKIE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
};

export async function getStatieActivaId(): Promise<string | null> {
  const store = await cookies();
  return store.get(COOKIE_STATIE_ACTIVA)?.value ?? null;
}

export async function setStatieActivaId(statieId: string) {
  const store = await cookies();
  store.set(COOKIE_STATIE_ACTIVA, statieId, OPTIUNI_COOKIE);
}

export async function stergeStatieActiva() {
  const store = await cookies();
  store.delete(COOKIE_STATIE_ACTIVA);
}
