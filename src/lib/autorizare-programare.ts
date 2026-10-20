import "server-only";

import { isAuthApiError, isAuthSessionMissingError, type AuthError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getImpersonare } from "@/lib/impersonation";
import { DEFAULT_PERMISIUNI } from "@/lib/actions/angajati-types";

/**
 * Autorizare pe o programare CONCRETĂ, pentru acțiunile care lucrează apoi cu
 * service client (ocolesc RLS) — ex. pozele ITP.
 *
 * Față de getOwnerContext (angajat-context.ts), aici:
 *  - stația și proprietarul se deduc din programare, pe server;
 *  - angajatul trebuie să fie ACTIV, să lucreze chiar la stația programării
 *    (nu doar la același proprietar) și să aibă permisiunea „programari”;
 *  - contul suspendat este refuzat; pentru angajat se citește și suspendarea
 *    proprietarului (ownerSuspendat — acțiunea decide ce refuză);
 *  - totul se citește cu service client, deci rezultatul nu depinde de
 *    politicile RLS live (care nu sunt versionate în repo).
 *
 * Modul server-only, NU "use server": nu devine endpoint public.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface ContextProgramare {
  userId: string;
  rol: "owner" | "angajat";
  /** Proprietarul stației programării. */
  ownerId: string;
  /**
   * Contul proprietarului e suspendat (suspendarea se pune doar pe contul lui,
   * nu și pe angajați). Mereu false când apelantul e chiar proprietarul — contul
   * lui suspendat e refuzat direct.
   */
  ownerSuspendat: boolean;
  statieId: string;
  programare: {
    id: string;
    dataProgramare: string;
    oraStart: string;
    nrInmatriculare: string | null;
  };
  /**
   * Admin conectat în contul utilizatorului. Cookie-ul de impersonare NU e
   * semnat: îl folosim doar ca să RESTRÂNGEM (nu ștergem nimic), niciodată ca
   * să acordăm acces.
   */
  impersonare: boolean;
}

export type RezultatAutorizare =
  | { ok: true; ctx: ContextProgramare }
  /** tranzitoriu = eroare de citire (reîncercarea poate ajuta); altfel e refuz. */
  | { ok: false; error: string; tranzitoriu: boolean };

const EROARE_CITIRE = "A apărut o eroare. Încearcă din nou.";

// profiles.role / owner_profile_id și angajati.permisiuni există live, dar nu
// sunt (încă) în database.types.ts — le tipăm local.
type ProfilAutorizare = {
  role: string | null;
  owner_profile_id: string | null;
  suspended_at: string | null;
};

type ProgramareAutorizare = {
  id: string;
  statie_id: string;
  data_programare: string;
  ora_start: string;
  vehicul: { nr_inmatriculare: string | null } | { nr_inmatriculare: string | null }[] | null;
  statie: { owner_id: string } | { owner_id: string }[] | null;
};

function primul<T>(v: T | T[] | null | undefined): T | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

function refuz(error: string): RezultatAutorizare {
  return { ok: false, error, tranzitoriu: false };
}

/**
 * getUser() fără utilizator. E o deconectare (refuz) doar când Supabase Auth a răspuns clar:
 * fără sesiune, sau sesiune invalidă / expirată / revocată (4xx, în afară de 429). Rețeaua,
 * 5xx, 429 sau un răspuns ilizibil înseamnă doar că serviciul nu a putut răspunde acum.
 */
function esteDeconectare(eroare: AuthError): boolean {
  if (isAuthSessionMissingError(eroare)) return true;
  return isAuthApiError(eroare) && eroare.status >= 400 && eroare.status < 500 && eroare.status !== 429;
}

export async function autorizeazaProgramare(programareId: unknown): Promise<RezultatAutorizare> {
  if (typeof programareId !== "string" || !UUID_RE.test(programareId)) {
    return refuz("Programare invalidă");
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: eroareAuth,
  } = await supabase.auth.getUser();
  if (!user) {
    if (!eroareAuth || esteDeconectare(eroareAuth)) return refuz("Neautentificat");
    // Supabase Auth indisponibil: eroare de citire, nu deconectare — reîncercarea poate ajuta.
    console.error("[Autorizare programare] auth:", eroareAuth.name, eroareAuth.status ?? "-", eroareAuth.message);
    return { ok: false, error: EROARE_CITIRE, tranzitoriu: true };
  }

  const db = createServiceClient();
  const [profilRes, programareRes] = await Promise.all([
    db.from("profiles").select("role, owner_profile_id, suspended_at").eq("id", user.id).maybeSingle(),
    db
      .from("programari")
      .select(
        "id, statie_id, data_programare, ora_start, vehicul:vehicule(nr_inmatriculare), statie:statii(owner_id)"
      )
      .eq("id", programareId)
      .maybeSingle(),
  ]);

  if (profilRes.error || programareRes.error) {
    console.error(
      "[Autorizare programare]",
      profilRes.error?.message ?? programareRes.error?.message
    );
    return { ok: false, error: EROARE_CITIRE, tranzitoriu: true };
  }

  const profil = profilRes.data as unknown as ProfilAutorizare | null;
  const programare = programareRes.data as unknown as ProgramareAutorizare | null;

  if (!profil) return refuz("Neautentificat");
  if (profil.suspended_at) return refuz("Contul este suspendat");
  if (!programare) return refuz("Programarea nu a fost găsită");

  const ownerId = primul(programare.statie)?.owner_id;
  if (!ownerId) return refuz("Acces interzis");

  let rol: ContextProgramare["rol"];
  let ownerSuspendat = false;

  if (ownerId === user.id) {
    rol = "owner";
  } else if (profil.role === "angajat" && profil.owner_profile_id === ownerId) {
    const [angajatRes, ownerRes] = await Promise.all([
      db
        .from("angajati")
        .select("id, permisiuni")
        .eq("profile_id", user.id)
        .eq("statie_id", programare.statie_id)
        .eq("activ", true)
        .limit(1)
        .maybeSingle(),
      db.from("profiles").select("suspended_at").eq("id", ownerId).maybeSingle(),
    ]);

    const error = angajatRes.error ?? ownerRes.error;
    if (error) {
      console.error("[Autorizare programare] angajat:", error.message);
      return { ok: false, error: EROARE_CITIRE, tranzitoriu: true };
    }

    const angajat = angajatRes.data as unknown as { id: string; permisiuni: Record<string, unknown> | null } | null;
    if (!angajat) return refuz("Acces interzis");

    // Aceeași interpretare ca în ecranul proprietarului (angajat-drawer.tsx):
    // permisiuni lipsă = permisiunile implicite (programari: true).
    const permisiuni: Record<string, unknown> = { ...DEFAULT_PERMISIUNI, ...(angajat.permisiuni ?? {}) };
    if (permisiuni.programari !== true) {
      return refuz("Nu ai permisiunea de a lucra cu programările");
    }
    rol = "angajat";
    ownerSuspendat = !!ownerRes.data?.suspended_at;
  } else {
    return refuz("Acces interzis");
  }

  const imp = await getImpersonare();

  return {
    ok: true,
    ctx: {
      userId: user.id,
      rol,
      ownerId,
      ownerSuspendat,
      statieId: programare.statie_id,
      programare: {
        id: programare.id,
        dataProgramare: programare.data_programare,
        oraStart: programare.ora_start,
        nrInmatriculare: primul(programare.vehicul)?.nr_inmatriculare ?? null,
      },
      impersonare: imp !== null && imp.target_id === user.id,
    },
  };
}
