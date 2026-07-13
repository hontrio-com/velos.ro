"use server";

import { createClient } from "@/lib/supabase/server";
import { getStatieForUser } from "@/lib/get-user-statie";
import { revalidatePath } from "next/cache";
import { clientSchema } from "@/lib/validations/client";
import { capitalizeName } from "@/lib/format-name";
import { redirect } from "next/navigation";

/** Aplică Title Case pe nume/prenume înainte de salvare (păstrează valorile goale ca atare). */
function normalizeNames<T extends { nume: string; prenume?: string | undefined }>(data: T): T {
  return {
    ...data,
    nume: capitalizeName(data.nume),
    prenume: data.prenume ? capitalizeName(data.prenume) : data.prenume,
  };
}

async function getStatieId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const statie = await getStatieForUser();
  return { supabase, statieId: statie?.id ?? null };
}

export async function createClientAction(formData: unknown) {
  const parsed = clientSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Date invalide" };
  }

  const { supabase, statieId } = await getStatieId();
  if (!statieId) return { error: "Stație negăsită" };

  const { data, error } = await supabase
    .from("clienti")
    .insert({ ...normalizeNames(parsed.data), statie_id: statieId })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "Există deja un client cu acest telefon" };
    }
    return { error: error.message };
  }

  revalidatePath("/clienti");
  return { id: data.id };
}

export async function updateClientAction(id: string, formData: unknown) {
  const parsed = clientSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Date invalide" };
  }

  const { supabase, statieId } = await getStatieId();
  if (!statieId) return { error: "Stație negăsită" };

  const { error } = await supabase
    .from("clienti")
    .update(normalizeNames(parsed.data))
    .eq("id", id)
    .eq("statie_id", statieId);

  if (error) return { error: error.message };

  revalidatePath("/clienti");
  revalidatePath(`/clienti/${id}`);
  return { success: true };
}

export async function deleteClientAction(id: string) {
  const { supabase, statieId } = await getStatieId();
  if (!statieId) return { error: "Stație negăsită" };

  // Check for future appointments
  const today = new Date().toISOString().split("T")[0];
  const { count } = await supabase
    .from("programari")
    .select("id", { count: "exact", head: true })
    .eq("client_id", id)
    .eq("statie_id", statieId)
    .gte("data_programare", today)
    .in("status", ["programat", "in_lucru"]);

  if ((count ?? 0) > 0) {
    return {
      error: `Clientul are ${count} programare(i) viitoare active. Anulează-le înainte de ștergere.`,
    };
  }

  const { error } = await supabase
    .from("clienti")
    .delete()
    .eq("id", id)
    .eq("statie_id", statieId);

  if (error) return { error: error.message };

  revalidatePath("/clienti");
  return { success: true };
}

export async function updateNoteClientAction(id: string, observatii: string) {
  const { supabase, statieId } = await getStatieId();
  if (!statieId) return { error: "Stație negăsită" };

  const { error } = await supabase
    .from("clienti")
    .update({ observatii })
    .eq("id", id)
    .eq("statie_id", statieId);

  if (error) return { error: error.message };
  return { success: true };
}
