"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function deleteProgramareAction(
  id: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Neautentificat" };

  // Verifică ownership prin statie
  const { data: p } = await supabase
    .from("programari")
    .select("statie_id")
    .eq("id", id)
    .single();

  if (!p) return { error: "Programarea nu a fost găsită" };

  const { data: statie } = await supabase
    .from("statii")
    .select("id")
    .eq("id", p.statie_id)
    .eq("owner_id", user.id)
    .single();

  if (!statie) return { error: "Acces interzis" };

  const { error } = await supabase
    .from("programari")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/programari");
  revalidatePath("/dashboard");
  return { success: true };
}
