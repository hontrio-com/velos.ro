"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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

  // Verify ownership
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
    .select("statie_id, statii!inner(owner_id)")
    .eq("id", id)
    .single();

  const statie = Array.isArray(angajat?.statii) ? angajat.statii[0] : angajat?.statii;
  if (!angajat || (statie as { owner_id: string } | null)?.owner_id !== user.id) {
    return { success: false, error: "Acces interzis" };
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
