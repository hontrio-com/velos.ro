"use server";

import { createClient } from "@/lib/supabase/server";
import { sendSms, getProfileIdForStatie } from "@/lib/sms";

export async function trimiteRecenzieAction(
  programareId: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();

  // Fetch programare cu client + vehicul + statie
  const { data: p } = await supabase
    .from("programari")
    .select(`
      id, statie_id,
      client:clienti(id, nume, prenume, telefon, sms_optin),
      vehicul:vehicule(nr_inmatriculare)
    `)
    .eq("id", programareId)
    .single();

  if (!p) return { error: "Programare negăsită" };

  const client = Array.isArray(p.client) ? p.client[0] : p.client;

  // Skip silently dacă clientul nu are telefon sau a dezactivat SMS
  if (!client?.telefon || client.sms_optin === false) return { success: true };

  // Verifică setările recenzii pentru stație
  const { data: setari } = await (supabase as any)
    .from("setari_statie")
    .select("recenzii_activ, google_review_url")
    .eq("statie_id", p.statie_id)
    .maybeSingle();

  if (!setari?.recenzii_activ || !setari.google_review_url) return { success: true };

  // Fetch statie pentru nume
  const { data: statie } = await supabase
    .from("statii")
    .select("nume")
    .eq("id", p.statie_id)
    .single();

  const vehicul = Array.isArray(p.vehicul) ? p.vehicul[0] : p.vehicul;
  const profileId = await getProfileIdForStatie(p.statie_id);
  if (!profileId) return { error: "Owner negăsit" };

  const mesaj = `Multumim ca ati ales ${statie?.nume ?? "statia noastra"} pentru ITP-ul vehiculului ${vehicul?.nr_inmatriculare ?? ""}! Ne-ar ajuta mult o recenzie: ${setari.google_review_url}`;

  const result = await sendSms({
    telefon: client.telefon,
    mesaj,
    profileId,
    statieId: p.statie_id,
    clientId: client.id,
  });

  if (!result.success) return { error: result.error ?? "Eroare SMS" };
  return { success: true };
}
