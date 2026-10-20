"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getStatieForUser } from "@/lib/get-user-statie";
import { getSmsDisponibil } from "@/lib/sms-disponibil";
import type { SmsDisponibil } from "@/lib/sms-disponibil-shared";

/**
 * SMS-urile disponibile pentru stația utilizatorului logat — mereu din contul
 * PROPRIETARULUI (angajații consumă din SMS-urile owner-ului, vezi remindere.ts /
 * mesaje.ts). Contul se alege pe server; clientul nu trimite niciun id.
 * Folosită de widget, banner, Remindere, dialogul de trimitere în masă.
 */
export async function getSmsDisponibilAction(): Promise<SmsDisponibil | null> {
  const statie = await getStatieForUser();
  if (statie) return getSmsDisponibil(statie.owner_profile_id);

  // Fără stație activă: un proprietar își vede propriul cont (ex. stații
  // dezactivate); un angajat fără înregistrare activă nu primește nimic.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profil } = await createServiceClient()
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (!profil || profil.role === "angajat") return null;

  return getSmsDisponibil(user.id);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Pagina Remindere, doar pentru trialul nou: stația AFIȘATĂ are „Remindere SMS"
 * oprit din setări (setari_statie.sms_activ = false), deci cron-ul îi anulează
 * reminderele automate. E o setare a stației, nu a contului: id-ul vine de la
 * pagină și NU se ia din cookie-ul stației active (se poate schimba între timp
 * din bara laterală sau din alt tab). Răspunde doar proprietarului stației și
 * angajaților ei activi cu permisiunea „remindere"; altfel false.
 */
export async function getRemindereOpriteAction(statieId: string): Promise<boolean> {
  if (typeof statieId !== "string" || !UUID_RE.test(statieId)) return false;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const db = createServiceClient();
  const { data: statie } = await db.from("statii").select("owner_id").eq("id", statieId).maybeSingle();
  if (!statie) return false;

  if (statie.owner_id !== user.id) {
    // angajati.permisiuni există live, dar nu (încă) în database.types.ts.
    const { data } = await db
      .from("angajati")
      .select("permisiuni")
      .eq("profile_id", user.id)
      .eq("statie_id", statieId)
      .eq("activ", true)
      .limit(1)
      .maybeSingle();
    const angajat = data as unknown as { permisiuni: Record<string, unknown> | null } | null;
    // Ca în layout-ul dashboard-ului: fără permisiunea „remindere" pagina nu se deschide.
    if (angajat?.permisiuni?.remindere !== true) return false;
  }

  // Ca în cron: doar un rând explicit cu sms_activ = false oprește reminderele
  // automate (fără rând = pornit); o eroare de citire înseamnă tot „pornit".
  const { data: setari, error } = await db
    .from("setari_statie")
    .select("sms_activ")
    .eq("statie_id", statieId)
    .maybeSingle();
  if (error) {
    console.error("[sms-disponibil] Setările SMS ale stației necitite:", statieId, error.message);
  }
  return setari?.sms_activ === false;
}
