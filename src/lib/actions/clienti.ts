"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { clientSchema } from "@/lib/validations/client";
import { redirect } from "next/navigation";

async function getStatieId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: statie } = await supabase
    .from("statii")
    .select("id")
    .eq("owner_id", user.id)
    .eq("activa", true)
    .order("created_at")
    .limit(1)
    .single();

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
    .insert({ ...parsed.data, statie_id: statieId })
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
    .update(parsed.data)
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
