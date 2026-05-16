import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export interface UserStatie {
  id: string;
  nume: string;
  slug: string | null;
  telefon: string | null;
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

  // Owner path — regular client with RLS
  const { data: ownerStatie } = await supabase
    .from("statii")
    .select("id, nume, slug, telefon")
    .eq("owner_id", user.id)
    .eq("activa", true)
    .order("created_at")
    .limit(1)
    .maybeSingle();

  if (ownerStatie) return ownerStatie as UserStatie;

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
    .select("id, nume, slug, telefon")
    .eq("id", angajat.statie_id)
    .maybeSingle();

  return (statie as UserStatie) ?? null;
}
