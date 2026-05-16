"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";
import { sendAngajatInvitatieEmail } from "@/lib/actions/email";

export interface AngajatForm {
  nume: string;
  functie?: string;
  telefon?: string;
  email?: string;
  activ?: boolean;
}

export interface AngajatActionResult {
  success: boolean;
  error?: string;
  id?: string;
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

/** Gets the authenticated supabase client + statieId for the current user. */
async function getStatieContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, statieId: null, userId: null };

  const { data: statie } = await supabase
    .from("statii")
    .select("id, nume")
    .eq("owner_id", user.id)
    .eq("activa", true)
    .order("created_at")
    .limit(1)
    .single();

  return { supabase, statieId: statie?.id ?? null, userId: user.id, statieNume: statie?.nume ?? null };
}

// ── CREATE ──────────────────────────────────────────────────────────────────

export async function createAngajatAction(form: AngajatForm): Promise<AngajatActionResult> {
  const { supabase, statieId } = await getStatieContext();
  if (!statieId) return { success: false, error: "Neautentificat sau nicio stație activă" };

  const { data, error } = await supabase
    .from("angajati")
    .insert({
      statie_id: statieId,
      nume: form.nume.trim(),
      functie: form.functie?.trim() || null,
      telefon: form.telefon?.trim() || null,
      email: form.email?.trim() || null,
      activ: form.activ ?? true,
    })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath("/angajati");
  return { success: true, id: data.id };
}

// ── UPDATE ──────────────────────────────────────────────────────────────────

export async function updateAngajatAction(id: string, form: AngajatForm): Promise<AngajatActionResult> {
  const { supabase, statieId } = await getStatieContext();
  if (!statieId) return { success: false, error: "Neautentificat sau nicio stație activă" };

  const { error } = await supabase
    .from("angajati")
    .update({
      nume: form.nume.trim(),
      functie: form.functie?.trim() || null,
      telefon: form.telefon?.trim() || null,
      email: form.email?.trim() || null,
      activ: form.activ ?? true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("statie_id", statieId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/angajati");
  return { success: true };
}

// ── DELETE ──────────────────────────────────────────────────────────────────

export async function deleteAngajatAction(id: string): Promise<AngajatActionResult> {
  const { supabase, statieId } = await getStatieContext();
  if (!statieId) return { success: false, error: "Neautentificat sau nicio stație activă" };

  // Get profile_id before deleting
  const { data: angajat } = await supabase
    .from("angajati")
    .select("profile_id")
    .eq("id", id)
    .eq("statie_id", statieId)
    .single();

  if (!angajat) return { success: false, error: "Angajat negăsit" };

  // If angajat has an auth account, delete it using service client (admin needed)
  const profileId = (angajat as any).profile_id as string | null;
  if (profileId) {
    const adminDb = createServiceClient();
    await adminDb.auth.admin.deleteUser(profileId).catch(console.error);
  }

  const { error } = await supabase.from("angajati").delete().eq("id", id).eq("statie_id", statieId);
  if (error) return { success: false, error: error.message };

  revalidatePath("/angajati");
  return { success: true };
}

// ── TOGGLE ACTIV ─────────────────────────────────────────────────────────────

export async function toggleAngajatActivAction(id: string, activ: boolean): Promise<AngajatActionResult> {
  const { supabase, statieId } = await getStatieContext();
  if (!statieId) return { success: false, error: "Neautentificat sau nicio stație activă" };

  const { error } = await supabase
    .from("angajati")
    .update({ activ, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("statie_id", statieId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/angajati");
  return { success: true };
}

// ── UPDATE PERMISIUNI ────────────────────────────────────────────────────────

export async function updateAngajatPermisiuniAction(
  angajatId: string,
  permisiuni: Permisiuni
): Promise<AngajatActionResult> {
  const { supabase, statieId } = await getStatieContext();
  if (!statieId) return { success: false, error: "Neautentificat sau nicio stație activă" };

  const { error } = await (supabase as any)
    .from("angajati")
    .update({ permisiuni, updated_at: new Date().toISOString() })
    .eq("id", angajatId)
    .eq("statie_id", statieId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/angajati");
  return { success: true };
}

// ── CREATE CONT ──────────────────────────────────────────────────────────────

export async function createAngajatContAction(
  angajatId: string,
  email: string,
  parola: string,
  permisiuni: Permisiuni
): Promise<AngajatActionResult> {
  const { supabase, statieId, userId, statieNume } = await getStatieContext();
  if (!statieId || !userId) return { success: false, error: "Neautentificat sau nicio stație activă" };

  const { data: angajat } = await supabase
    .from("angajati")
    .select("id, nume, email, profile_id")
    .eq("id", angajatId)
    .eq("statie_id", statieId)
    .single();

  if (!angajat) return { success: false, error: "Angajat negăsit" };

  if ((angajat as any).profile_id) {
    return { success: false, error: "Angajatul are deja un cont activ" };
  }

  // Auth admin operations require service client
  const adminDb = createServiceClient();

  const { data: newUser, error: authError } = await adminDb.auth.admin.createUser({
    email: email.trim(),
    password: parola,
    email_confirm: true,
  });

  if (authError || !newUser.user) {
    return { success: false, error: authError?.message ?? "Eroare la crearea contului" };
  }

  const newUserId = newUser.user.id;

  // Upsert profile (handle_new_user trigger may have already created a basic row)
  const { error: profileError } = await (adminDb as any)
    .from("profiles")
    .upsert({
      id: newUserId,
      email: email.trim(),
      full_name: (angajat as any).nume,
      role: "angajat",
      owner_profile_id: userId,
      onboarding_completed: true,
      plan: "owner",
      subscription_status: "active",
      trial_expires_at: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString(),
    }, { onConflict: "id" });

  if (profileError) {
    await adminDb.auth.admin.deleteUser(newUserId).catch(console.error);
    return { success: false, error: profileError.message };
  }

  // Link profile_id to angajat and update permisiuni
  const { error: linkError } = await (supabase as any)
    .from("angajati")
    .update({
      profile_id: newUserId,
      email: email.trim(),
      permisiuni,
      updated_at: new Date().toISOString(),
    })
    .eq("id", angajatId)
    .eq("statie_id", statieId);

  if (linkError) {
    await adminDb.auth.admin.deleteUser(newUserId).catch(console.error);
    return { success: false, error: linkError.message };
  }

  // Send invitation email (fire-and-forget)
  const permisiuniLabel: Record<keyof Permisiuni, string> = {
    programari: "Programări",
    clienti: "Clienți",
    vehicule: "Vehicule",
    rapoarte: "Rapoarte",
    remindere: "Remindere",
  };

  const permisiuniActive = (Object.keys(permisiuni) as (keyof Permisiuni)[])
    .filter((k) => permisiuni[k])
    .map((k) => permisiuniLabel[k]);

  sendAngajatInvitatieEmail(email.trim(), {
    numeAngajat: (angajat as any).nume,
    numeStatie: statieNume ?? "",
    email: email.trim(),
    parola,
    permisiuni: permisiuniActive,
  }).catch(console.error);

  revalidatePath("/angajati");
  return { success: true };
}

// ── DELETE CONT ──────────────────────────────────────────────────────────────

export async function deleteAngajatContAction(angajatId: string): Promise<AngajatActionResult> {
  const { supabase, statieId } = await getStatieContext();
  if (!statieId) return { success: false, error: "Neautentificat sau nicio stație activă" };

  const { data: angajat } = await supabase
    .from("angajati")
    .select("profile_id")
    .eq("id", angajatId)
    .eq("statie_id", statieId)
    .single();

  if (!angajat) return { success: false, error: "Angajat negăsit" };

  const profileId = (angajat as any).profile_id as string | null;
  if (!profileId) return { success: false, error: "Angajatul nu are cont" };

  const adminDb = createServiceClient();
  const { error: authErr } = await adminDb.auth.admin.deleteUser(profileId);
  if (authErr) return { success: false, error: authErr.message };

  await (supabase as any)
    .from("angajati")
    .update({ profile_id: null, updated_at: new Date().toISOString() })
    .eq("id", angajatId)
    .eq("statie_id", statieId);

  revalidatePath("/angajati");
  return { success: true };
}
