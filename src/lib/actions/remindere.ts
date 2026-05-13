"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendSms, buildTemplateVars, interpolateTemplate } from "@/lib/sms";
import type { TipReminder } from "@/lib/remindere-generator";
import { DEFAULT_TEMPLATES } from "@/lib/remindere-generator";

async function getContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: statie } = await supabase
    .from("statii")
    .select("id, nume, telefon")
    .eq("owner_id", user.id)
    .eq("activa", true)
    .order("created_at")
    .limit(1)
    .single();

  return { supabase, statie, profileId: user.id };
}

export async function genereazaRemindereAction() {
  const { supabase, statie } = await getContext();
  if (!statie) return { error: "Stație negăsită" };

  const { data, error } = await supabase.rpc("genereaza_remindere_zilnice", {
    p_statie_id: statie.id,
  });

  if (error) return { error: error.message };
  revalidatePath("/remindere");
  return { success: true, data };
}

export async function trimiteReminderAction(reminderId: string) {
  const { supabase, statie, profileId } = await getContext();
  if (!statie) return { success: false, error: "Stație negăsită" };

  const { data: r, error: fetchErr } = await supabase
    .from("remindere")
    .select(`
      id, tip, status, mesaj, statie_id,
      client:clienti(id, nume, telefon, sms_optin),
      vehicul:vehicule(nr_inmatriculare, expirare_itp),
      programare:programari(data_programare, ora_start)
    `)
    .eq("id", reminderId)
    .eq("statie_id", statie.id)
    .single();

  if (fetchErr || !r) return { success: false, error: "Reminder negăsit" };

  const client = Array.isArray(r.client) ? r.client[0] : r.client;
  const vehicul = Array.isArray(r.vehicul) ? r.vehicul[0] : r.vehicul;
  const programare = Array.isArray(r.programare) ? r.programare[0] : r.programare;

  if (!client?.sms_optin) return { success: false, error: "Clientul are SMS dezactivat" };
  if (!client?.telefon) return { success: false, error: "Clientul nu are telefon" };

  // Template
  const { data: tmpl } = await supabase
    .from("sms_templates")
    .select("mesaj")
    .or(`statie_id.eq.${statie.id},statie_id.is.null`)
    .eq("tip", r.tip as TipReminder)
    .order("statie_id", { nullsFirst: false })
    .limit(1)
    .single();

  const templateText = tmpl?.mesaj ?? DEFAULT_TEMPLATES[r.tip as TipReminder] ?? r.mesaj ?? "";

  const vars = buildTemplateVars({
    clientNume: client.nume,
    nrInmatriculare: vehicul?.nr_inmatriculare ?? "",
    expirareItp: vehicul?.expirare_itp,
    dataProgramare: programare?.data_programare,
    oraProgramare: programare?.ora_start,
    statieNume: statie.nume,
    statieTelefon: statie.telefon,
  });

  const mesajFinal = interpolateTemplate(templateText, vars);

  const result = await sendSms({
    telefon: client.telefon,
    mesaj: mesajFinal,
    profileId,
    statieId: statie.id,
    clientId: client.id,
  });

  if (result.success) {
    await supabase
      .from("remindere")
      .update({ status: "trimis", trimis_la: new Date().toISOString(), mesaj: mesajFinal, trimis: true })
      .eq("id", reminderId);
  } else {
    await supabase
      .from("remindere")
      .update({ status: "eroare", eroare: result.error })
      .eq("id", reminderId);
  }

  revalidatePath("/remindere");
  return result;
}

export async function trimiteSmsManualAction(params: {
  clientId: string;
  telefon: string;
  mesaj: string;
  vehiculId?: string;
  tipReminder?: TipReminder;
}) {
  const { supabase, statie, profileId } = await getContext();
  if (!statie) return { success: false, error: "Stație negăsită" };

  const result = await sendSms({
    telefon: params.telefon,
    mesaj: params.mesaj,
    profileId,
    statieId: statie.id,
    clientId: params.clientId,
  });

  if (result.success && params.vehiculId && params.tipReminder) {
    const today = new Date().toISOString().split("T")[0];
    await supabase.from("remindere").insert({
      statie_id: statie.id,
      vehicul_id: params.vehiculId,
      client_id: params.clientId,
      tip: params.tipReminder,
      canal: "sms",
      data_trimitere: today,
      programat_la: new Date().toISOString(),
      trimis_la: result.success ? new Date().toISOString() : null,
      status: result.success ? "trimis" : "eroare",
      mesaj: params.mesaj,
      trimis: result.success,
      eroare: result.error ?? null,
    });
  }

  revalidatePath("/remindere");
  return result;
}

export async function anuleazaReminderAction(reminderId: string) {
  const { supabase, statie } = await getContext();
  if (!statie) return { error: "Stație negăsită" };

  const { error } = await supabase
    .from("remindere")
    .update({ status: "anulat" })
    .eq("id", reminderId)
    .eq("statie_id", statie.id);

  if (error) return { error: error.message };
  revalidatePath("/remindere");
  return { success: true };
}

export async function amanaReminderAction(reminderId: string, ore: number) {
  const { supabase, statie } = await getContext();
  if (!statie) return { error: "Stație negăsită" };

  const { data: r } = await supabase
    .from("remindere")
    .select("programat_la")
    .eq("id", reminderId)
    .single();

  if (!r) return { error: "Reminder negăsit" };

  const newTime = new Date(r.programat_la ?? Date.now());
  newTime.setHours(newTime.getHours() + ore);

  const { error } = await supabase
    .from("remindere")
    .update({ programat_la: newTime.toISOString() })
    .eq("id", reminderId)
    .eq("statie_id", statie.id);

  if (error) return { error: error.message };
  revalidatePath("/remindere");
  return { success: true };
}

export async function retrimiteReminderAction(reminderId: string) {
  const { supabase, statie } = await getContext();
  if (!statie) return { success: false, error: "Stație negăsită" };

  const { error } = await supabase
    .from("remindere")
    .update({ status: "pending", programat_la: new Date().toISOString(), eroare: null })
    .eq("id", reminderId)
    .eq("statie_id", statie.id);

  if (error) return { success: false, error: error.message };
  return trimiteReminderAction(reminderId);
}

export async function saveTemplateAction(tip: TipReminder, mesaj: string) {
  const { supabase, statie } = await getContext();
  if (!statie) return { error: "Stație negăsită" };

  const { error } = await supabase
    .from("sms_templates")
    .upsert({ statie_id: statie.id, tip, mesaj, updated_at: new Date().toISOString() }, {
      onConflict: "statie_id,tip",
    });

  if (error) return { error: error.message };
  revalidatePath("/remindere");
  return { success: true };
}

export async function resetTemplateAction(tip: TipReminder) {
  const { supabase, statie } = await getContext();
  if (!statie) return { error: "Stație negăsită" };

  const { error } = await supabase
    .from("sms_templates")
    .delete()
    .eq("statie_id", statie.id)
    .eq("tip", tip);

  if (error) return { error: error.message };
  revalidatePath("/remindere");
  return { success: true };
}
