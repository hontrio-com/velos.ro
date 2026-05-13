"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { vehiculSchema } from "@/lib/validations/vehicul";
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

export async function createVehiculAction(formData: unknown) {
  const parsed = vehiculSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Date invalide" };
  }

  const { supabase, statieId } = await getStatieId();
  if (!statieId) return { error: "Stație negăsită" };

  const payload = {
    ...parsed.data,
    statie_id: statieId,
    expirare_itp: parsed.data.expirare_itp || null,
    expirare_rca: parsed.data.expirare_rca || null,
    expirare_rovinieta: parsed.data.expirare_rovinieta || null,
    serie_sasiu: parsed.data.serie_sasiu || null,
    culoare: parsed.data.culoare || null,
    combustibil: parsed.data.combustibil || null,
    observatii: parsed.data.observatii || null,
  };

  const { data, error } = await supabase
    .from("vehicule")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "Există deja un vehicul cu acest număr de înmatriculare" };
    }
    return { error: error.message };
  }

  revalidatePath("/vehicule");
  revalidatePath(`/clienti/${parsed.data.client_id}`);
  return { id: data.id };
}

export async function updateVehiculAction(id: string, formData: unknown) {
  const parsed = vehiculSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Date invalide" };
  }

  const { supabase, statieId } = await getStatieId();
  if (!statieId) return { error: "Stație negăsită" };

  const payload = {
    ...parsed.data,
    expirare_itp: parsed.data.expirare_itp || null,
    expirare_rca: parsed.data.expirare_rca || null,
    expirare_rovinieta: parsed.data.expirare_rovinieta || null,
    serie_sasiu: parsed.data.serie_sasiu || null,
    culoare: parsed.data.culoare || null,
    combustibil: parsed.data.combustibil || null,
    observatii: parsed.data.observatii || null,
  };

  const { error } = await supabase
    .from("vehicule")
    .update(payload)
    .eq("id", id)
    .eq("statie_id", statieId);

  if (error) return { error: error.message };

  revalidatePath("/vehicule");
  revalidatePath(`/vehicule/${id}`);
  revalidatePath(`/clienti/${parsed.data.client_id}`);
  return { success: true };
}

export async function deleteVehiculAction(id: string) {
  const { supabase, statieId } = await getStatieId();
  if (!statieId) return { error: "Stație negăsită" };

  // Check for future appointments
  const today = new Date().toISOString().split("T")[0];
  const { count } = await supabase
    .from("programari")
    .select("id", { count: "exact", head: true })
    .eq("vehicul_id", id)
    .eq("statie_id", statieId)
    .gte("data_programare", today)
    .in("status", ["programat", "in_lucru"]);

  if ((count ?? 0) > 0) {
    return {
      error: `Vehiculul are ${count} programare(i) viitoare active. Anulează-le înainte de ștergere.`,
    };
  }

  const { error } = await supabase
    .from("vehicule")
    .delete()
    .eq("id", id)
    .eq("statie_id", statieId);

  if (error) return { error: error.message };

  revalidatePath("/vehicule");
  return { success: true };
}
