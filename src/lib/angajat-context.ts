"use server";

import type { SupabaseClient } from "@supabase/supabase-js";

export interface OwnerContext {
  role: "owner" | "angajat";
  ownerId: string;
  angajatId: string | null;
  angajatNume: string | null;
  angajatFunctie: string | null;
  statieId: string | null;
}

/**
 * Determines the "effective owner" context for the current user.
 * - If owner: ownerId = user.id
 * - If angajat: ownerId = their owner's profile id (for station ownership checks)
 */
export async function getOwnerContext(
  supabase: SupabaseClient<any>,
  userId: string
): Promise<OwnerContext | null> {
  const { data: profile } = await (supabase as any)
    .from("profiles")
    .select("role, owner_profile_id")
    .eq("id", userId)
    .single();

  if (!profile) return null;

  const role: "owner" | "angajat" = profile.role ?? "owner";

  if (role === "owner") {
    return {
      role: "owner",
      ownerId: userId,
      angajatId: null,
      angajatNume: null,
      angajatFunctie: null,
      statieId: null,
    };
  }

  // angajat — fetch their record
  const ownerProfileId = profile.owner_profile_id;
  if (!ownerProfileId) return null;

  const { data: angajat } = await (supabase as any)
    .from("angajati")
    .select("id, nume, functie, statie_id")
    .eq("profile_id", userId)
    .single();

  if (!angajat) return null;

  return {
    role: "angajat",
    ownerId: ownerProfileId,
    angajatId: angajat.id,
    angajatNume: angajat.nume,
    angajatFunctie: angajat.functie ?? null,
    statieId: angajat.statie_id,
  };
}
