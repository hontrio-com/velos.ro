"use server";

import { createClient } from "@/lib/supabase/server";
import { getStatieForUser } from "@/lib/get-user-statie";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { sendSms } from "@/lib/sms";

async function getContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const statie = await getStatieForUser();
  return { supabase, user, statieId: statie?.id ?? null };
}

const sendSchema = z.object({
  client_id: z.string().uuid(),
  telefon: z.string().min(1),
  mesaj: z.string().min(1, "Mesajul nu poate fi gol").max(500),
});

export async function sendMesajAction(formData: unknown) {
  const parsed = sendSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Date invalide" };
  }

  const { user, statieId } = await getContext();
  if (!statieId) return { error: "Stație negăsită" };

  const { client_id, telefon, mesaj } = parsed.data;

  const result = await sendSms({
    telefon,
    mesaj,
    profileId: user.id,
    statieId,
    clientId: client_id,
  });

  if (!result.success) {
    return { error: result.error ?? "Eroare la trimiterea SMS-ului" };
  }

  revalidatePath(`/clienti/${client_id}`);
  return { success: true };
}
