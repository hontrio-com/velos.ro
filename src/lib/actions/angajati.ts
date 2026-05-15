"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect } from "next/navigation";
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

async function getStatieId(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase
    .from("statii")
    .select("id")
    .eq("owner_id", userId)
    .eq("activa", true)
    .order("created_at")
    .limit(1)
    .single();
  return data?.id ?? null;
}

export async function createAngajatAction(form: AngajatForm): Promise<AngajatActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const statieId = await getStatieId(supabase, user.id);
  if (!statieId) return { success: false, error: "Nicio stație activă" };

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
  return { success: true, id: data.id };
}

export async function updateAngajatAction(id: string, form: AngajatForm): Promise<AngajatActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: angajat } = await supabase
    .from("angajati")
    .select("statie_id, statii!inner(owner_id)")
    .eq("id", id)
    .single();

  const statie = Array.isArray(angajat?.statii) ? angajat.statii[0] : angajat?.statii;
  if (!angajat || (statie as { owner_id: string } | null)?.owner_id !== user.id) {
    return { success: false, error: "Acces interzis" };
  }

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
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteAngajatAction(id: string): Promise<AngajatActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: angajat } = await supabase
    .from("angajati")
    .select("statie_id, profile_id, statii!inner(owner_id)")
    .eq("id", id)
    .single();

  const statie = Array.isArray(angajat?.statii) ? angajat.statii[0] : angajat?.statii;
  if (!angajat || (statie as { owner_id: string } | null)?.owner_id !== user.id) {
    return { success: false, error: "Acces interzis" };
  }

  // If angajat has an auth account, delete it too
  if ((angajat as any).profile_id) {
    const serviceClient = createServiceClient();
    await serviceClient.auth.admin.deleteUser((angajat as any).profile_id).catch(console.error);
  }

  const { error } = await supabase.from("angajati").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function toggleAngajatActivAction(id: string, activ: boolean): Promise<AngajatActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("angajati")
    .update({ activ, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updateAngajatPermisiuniAction(
  angajatId: string,
  permisiuni: Permisiuni
): Promise<AngajatActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: angajat } = await supabase
    .from("angajati")
    .select("statie_id, statii!inner(owner_id)")
    .eq("id", angajatId)
    .single();

  const statie = Array.isArray(angajat?.statii) ? angajat.statii[0] : angajat?.statii;
  if (!angajat || (statie as { owner_id: string } | null)?.owner_id !== user.id) {
    return { success: false, error: "Acces interzis" };
  }

  const { error } = await (supabase as any)
    .from("angajati")
    .update({ permisiuni, updated_at: new Date().toISOString() })
    .eq("id", angajatId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/angajati");
  return { success: true };
}

export async function createAngajatContAction(
  angajatId: string,
  email: string,
  parola: string,
  permisiuni: Permisiuni
): Promise<AngajatActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Neautentificat" };

  // Verify ownership
  const { data: angajat } = await supabase
    .from("angajati")
    .select("id, nume, functie, email, profile_id, statie_id, statii!inner(id, nume, owner_id)")
    .eq("id", angajatId)
    .single();

  const statie = Array.isArray(angajat?.statii) ? angajat.statii[0] : angajat?.statii as { id: string; nume: string; owner_id: string } | null;
  if (!angajat || statie?.owner_id !== user.id) {
    return { success: false, error: "Acces interzis" };
  }

  if ((angajat as any).profile_id) {
    return { success: false, error: "Angajatul are deja un cont activ" };
  }

  const serviceClient = createServiceClient();

  // Create auth user (auto-confirmed)
  const { data: newUser, error: authError } = await serviceClient.auth.admin.createUser({
    email: email.trim(),
    password: parola,
    email_confirm: true,
  });

  if (authError || !newUser.user) {
    return { success: false, error: authError?.message ?? "Eroare la crearea contului" };
  }

  const newUserId = newUser.user.id;

  // Upsert profile with role='angajat'
  const { error: profileError } = await serviceClient
    .from("profiles" as any)
    .upsert({
      id: newUserId,
      email: email.trim(),
      full_name: (angajat as any).nume,
      role: "angajat",
      owner_profile_id: user.id,
      onboarding_completed: true,
      plan: "owner",
      subscription_status: "active",
      trial_expires_at: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString(),
    }, { onConflict: "id" });

  if (profileError) {
    await serviceClient.auth.admin.deleteUser(newUserId).catch(console.error);
    return { success: false, error: profileError.message };
  }

  // Link angajat.profile_id and update email + permisiuni
  const { error: linkError } = await serviceClient
    .from("angajati" as any)
    .update({
      profile_id: newUserId,
      email: email.trim(),
      permisiuni: permisiuni as any,
      updated_at: new Date().toISOString(),
    })
    .eq("id", angajatId);

  if (linkError) {
    await serviceClient.auth.admin.deleteUser(newUserId).catch(console.error);
    return { success: false, error: linkError.message };
  }

  // Send invitation email
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
    numeStatie: statie?.nume ?? "",
    email: email.trim(),
    parola,
    permisiuni: permisiuniActive,
  }).catch(console.error);

  revalidatePath("/angajati");
  return { success: true };
}

export async function deleteAngajatContAction(
  angajatId: string
): Promise<AngajatActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Neautentificat" };

  const { data: angajat } = await supabase
    .from("angajati")
    .select("profile_id, statii!inner(owner_id)")
    .eq("id", angajatId)
    .single();

  const statie = Array.isArray(angajat?.statii) ? angajat.statii[0] : angajat?.statii as { owner_id: string } | null;
  if (!angajat || statie?.owner_id !== user.id) {
    return { success: false, error: "Acces interzis" };
  }

  const profileId = (angajat as any).profile_id;
  if (!profileId) return { success: false, error: "Angajatul nu are cont" };

  const serviceClient = createServiceClient();
  const { error } = await serviceClient.auth.admin.deleteUser(profileId);
  if (error) return { success: false, error: error.message };

  // Unlink profile_id from angajat
  await supabase
    .from("angajati")
    .update({ profile_id: null, updated_at: new Date().toISOString() } as any)
    .eq("id", angajatId);

  revalidatePath("/angajati");
  return { success: true };
}
