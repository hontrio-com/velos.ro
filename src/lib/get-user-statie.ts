import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getStatieActivaId } from "@/lib/statie-activa";

export interface UserStatie {
  id: string;
  nume: string;
  slug: string | null;
  telefon: string | null;
  /** Always the station owner's profile ID — used for SMS quota billing */
  owner_profile_id: string;
}

/**
 * Resolves the active station for the current user.
 * Works for both owners (returns their first active station)
 * and employees (returns their assigned station via angajati record).
 */
export async function getStatieForUser(): Promise<UserStatie | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Owner path — statia aleasa din comutator, daca este a lui si este activa.
  const statieActivaId = await getStatieActivaId();

  if (statieActivaId) {
    const { data: aleasa } = await supabase
      .from("statii")
      .select("id, nume, slug, telefon")
      .eq("id", statieActivaId)
      .eq("owner_id", user.id)
      .eq("activa", true)
      .maybeSingle();

    if (aleasa) {
      return { ...(aleasa as Omit<UserStatie, "owner_profile_id">), owner_profile_id: user.id };
    }
    // Cookie invechit (statie stearsa, dezactivata sau a altui cont) — cadem pe prima.
  }

  const { data: ownerStatie } = await supabase
    .from("statii")
    .select("id, nume, slug, telefon")
    .eq("owner_id", user.id)
    .eq("activa", true)
    .order("created_at")
    .limit(1)
    .maybeSingle();

  if (ownerStatie) {
    return { ...(ownerStatie as Omit<UserStatie, "owner_profile_id">), owner_profile_id: user.id };
  }

  // Employee path — service client bypasses RLS
  const db = createServiceClient();
  const { data: angajat } = await db
    .from("angajati")
    .select("statie_id")
    .eq("profile_id", user.id)
    .eq("activ", true)
    .maybeSingle();

  if (!angajat?.statie_id) return null;

  const { data: statie } = await db
    .from("statii")
    .select("id, nume, slug, telefon, owner_id")
    .eq("id", angajat.statie_id)
    .maybeSingle();

  if (!statie) return null;

  return {
    id: (statie as any).id,
    nume: (statie as any).nume,
    slug: (statie as any).slug ?? null,
    telefon: (statie as any).telefon ?? null,
    owner_profile_id: (statie as any).owner_id,
  };
}
