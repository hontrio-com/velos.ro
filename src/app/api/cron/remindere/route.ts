import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendSms, buildTemplateVars, interpolateTemplate } from "@/lib/sms";
import { areTrialFaraSms, mesajFaraSms } from "@/lib/sms-disponibil";
import {
  MESAJ_REMINDERE_OPRITE_SETARI,
  MESAJ_REMINDERE_TRIAL_EXPIRAT,
} from "@/lib/sms-disponibil-shared";
import { DEFAULT_TEMPLATES } from "@/lib/remindere-generator";
import type { TipReminder } from "@/lib/remindere-generator";
import type { Database } from "@/types/database.types";

// 300 s = maximul pe orice plan Vercel cu Fluid Compute. Pe un proiect fără
// Fluid Compute (Hobby clasic, max 60 s) build-ul respinge valoarea: pune 60.
export const maxDuration = 300;

// Câte remindere scadente procesăm la o rulare, cele mai vechi întâi. Limita e
// mai mare decât cea veche (100), ca stațiile plătitoare să nu fie amânate;
// stațiile din trialul nou care nu pot trimite nu intră în coadă (gasesteStatiiOprite).
const LIMITA_REMINDERE = 300;

// După acest prag nu mai pornim trimiteri noi: un timeout între trimiterea
// SMS-ului și marcarea reminderului l-ar lăsa „pending" → SMS dublat a doua zi.
const BUGET_TRIMITERE_MS = 240_000;

// Câte id-uri intră într-un filtru .in() (URL-ul cererii rămâne scurt).
const LOT_IN = 100;

type Db = ReturnType<typeof createServiceClient>;
type ProfilCohorta = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "plan" | "sms_credit" | "subscription_status" | "trial_expires_at" | "trial_fara_sms"
>;

/** Ce primesc reminderele scadente ale unei stații oprite (în loc de trimitere). */
interface Oprire {
  status: "anulat" | "eroare";
  eroare: string;
}

function inLoturi<T>(valori: T[]): T[][] {
  const loturi: T[][] = [];
  for (let i = 0; i < valori.length; i += LOT_IN) loturi.push(valori.slice(i, i + LOT_IN));
  return loturi;
}

// Aceeași regulă ca în layout-ul dashboard-ului (effectiveStatus).
function trialIncheiat(p: ProfilCohorta, acum: number): boolean {
  return (
    p.subscription_status === "trial_expired" ||
    (p.subscription_status === "trial" &&
      !!p.trial_expires_at &&
      new Date(p.trial_expires_at).getTime() < acum)
  );
}

/**
 * Stațiile care NU primesc remindere automate la rularea asta — doar ale
 * conturilor din trialul nou (profiles.trial_fara_sms, migrația 012). Prima
 * regulă potrivită câștigă:
 *  a) „Remindere SMS" oprit din setările stației (oricare ar fi planul);
 *  b) perioada de probă s-a încheiat și nu s-a ales un plan;
 *  c) perioada de probă, fără credit SMS (sendSms le-ar refuza oricum).
 * Conturile existente nu au marcajul, deci nu apar aici: pentru ele totul
 * rămâne ca până acum. Orice eroare de citire => nicio stație oprită.
 */
async function gasesteStatiiOprite(
  supabase: Db,
  statii: { id: string; owner_id: string }[],
  acum: number
): Promise<Map<string, Oprire>> {
  const opriri = new Map<string, Oprire>();
  try {
    // Fără migrația 012 coloana lipsește, select-ul eșuează => nicio stație oprită.
    const cohorta = new Map<string, ProfilCohorta>();
    const owneri = [...new Set(statii.map((s) => s.owner_id).filter(Boolean))];
    for (const lot of inLoturi(owneri)) {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, plan, sms_credit, subscription_status, trial_expires_at, trial_fara_sms")
        .in("id", lot)
        .eq("trial_fara_sms", true);
      if (error) {
        console.error("[CRON] Conturile din trialul nou nu au putut fi citite:", error.message);
        return opriri;
      }
      for (const p of data ?? []) cohorta.set(p.id, p);
    }

    const statiiCohorta = statii.filter((s) => cohorta.has(s.owner_id));
    if (statiiCohorta.length === 0) return opriri;

    // Comutatorul „Remindere SMS": doar rândurile explicite cu sms_activ = false
    // (fără rând = pornit). Un lot necitit => stațiile lui rămân pornite.
    const smsOprit = new Set<string>();
    for (const lot of inLoturi(statiiCohorta.map((s) => s.id))) {
      const { data, error } = await supabase
        .from("setari_statie")
        .select("statie_id")
        .in("statie_id", lot)
        .eq("sms_activ", false);
      if (error) {
        console.error("[CRON] Setările SMS ale stațiilor nu au putut fi citite:", error.message);
        continue;
      }
      for (const r of data ?? []) smsOprit.add(r.statie_id);
    }

    for (const s of statiiCohorta) {
      const p = cohorta.get(s.owner_id);
      if (!p) continue;
      if (smsOprit.has(s.id)) {
        opriri.set(s.id, { status: "anulat", eroare: MESAJ_REMINDERE_OPRITE_SETARI });
      } else if (areTrialFaraSms(p) && trialIncheiat(p, acum)) {
        opriri.set(s.id, { status: "anulat", eroare: MESAJ_REMINDERE_TRIAL_EXPIRAT });
      } else if (areTrialFaraSms(p) && (p.sms_credit ?? 0) <= 0) {
        // Exact textul pe care l-ar scrie sendSms.
        opriri.set(s.id, { status: "eroare", eroare: mesajFaraSms(p.subscription_status) });
      }
    }
  } catch (err) {
    console.error("[CRON] Stațiile oprite nu au putut fi stabilite:", err);
    return new Map();
  }
  return opriri;
}

/**
 * Reminderele scadente (pending, programat_la <= now) ale stațiilor oprite,
 * marcate în bloc: fără trimitere și fără rânduri în mesaje. Același `now` ca
 * selecția de trimitere, ca niciunul să nu ajungă în coadă. Întoarce câte s-au marcat.
 */
async function opresteRemindereScadente(
  supabase: Db,
  opriri: Map<string, Oprire>,
  now: string
): Promise<number> {
  // O actualizare per text (cel mult patru), pe loturi de stații.
  const grupuri = new Map<string, { oprire: Oprire; statieIds: string[] }>();
  for (const [statieId, oprire] of opriri) {
    const cheie = `${oprire.status}|${oprire.eroare}`;
    const grup = grupuri.get(cheie) ?? { oprire, statieIds: [] };
    grup.statieIds.push(statieId);
    grupuri.set(cheie, grup);
  }

  let marcate = 0;
  for (const { oprire, statieIds } of grupuri.values()) {
    for (const lot of inLoturi(statieIds)) {
      const { count, error } = await supabase
        .from("remindere")
        .update({ status: oprire.status, eroare: oprire.eroare }, { count: "exact" })
        .eq("status", "pending")
        .lte("programat_la", now)
        .in("statie_id", lot);
      if (error) {
        // Ce rămâne pending se marchează unul câte unul în bucla de trimitere.
        console.error("[CRON] Remindere neoprite:", error.message);
      } else {
        marcate += count ?? 0;
      }
    }
  }
  return marcate;
}

export async function GET(request: Request) {
  // Support both Vercel native cron (Authorization: Bearer) and manual trigger (x-cron-secret)
  const bearerToken = request.headers.get("authorization")?.replace("Bearer ", "");
  const customHeader = request.headers.get("x-cron-secret");
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret || (bearerToken !== expectedSecret && customHeader !== expectedSecret)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const pornitLa = Date.now();
  const supabase = createServiceClient();

  // Step 1: Generate pending reminders for all stations
  // (în afară de stațiile oprite ale conturilor din trialul nou)
  const { data: statii } = await supabase.from("statii").select("id, owner_id");
  const opriri = await gasesteStatiiOprite(supabase, statii ?? [], pornitLa);
  let generated = 0;
  for (const s of statii ?? []) {
    if (opriri.has(s.id)) continue;
    const { data } = await supabase.rpc("genereaza_remindere_zilnice", { p_statie_id: s.id });
    generated += (data as { total?: number } | null)?.total ?? 0;
  }

  // Step 2: Send pending reminders (cele mai vechi întâi)
  // `now` rămâne DUPĂ generare: generatorul pune programat_la = now() din baza de
  // date, iar reminderele generate acum trebuie să plece la rularea asta.
  const now = new Date().toISOString();

  // Reminderele scadente ale stațiilor oprite nu ocupă locuri în coadă.
  let oprite = await opresteRemindereScadente(supabase, opriri, now);

  const { data: remindere, error } = await supabase
    .from("remindere")
    .select(`
      id, tip, mesaj, statie_id,
      client:clienti(id, nume, telefon, sms_optin),
      vehicul:vehicule(nr_inmatriculare, expirare_itp),
      programare:programari(data_programare, ora_start),
      statie:statii(id, nume, telefon, slug, owner_id)
    `)
    .eq("status", "pending")
    .lte("programat_la", now)
    .order("programat_la", { ascending: true })
    .order("id", { ascending: true })
    .limit(LIMITA_REMINDERE);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let trimise = 0;
  let erori = 0;
  let amanate = 0;
  const lista = remindere ?? [];
  // Conturile din trialul nou rămase fără SMS la o trimitere din rularea asta:
  // restul reminderelor lor primesc aceeași eroare, fără alte încercări.
  const faraSms = new Map<string, Oprire>();

  for (let i = 0; i < lista.length; i++) {
    if (Date.now() - pornitLa > BUGET_TRIMITERE_MS) {
      amanate = lista.length - i;
      console.warn(`[CRON] Buget de timp atins — ${amanate} remindere rămân pending pentru rularea următoare`);
      break;
    }
    const r = lista[i];

    const client = Array.isArray(r.client) ? r.client[0] : r.client;
    const vehicul = Array.isArray(r.vehicul) ? r.vehicul[0] : r.vehicul;
    const programare = Array.isArray(r.programare) ? r.programare[0] : r.programare;
    const statie = Array.isArray(r.statie) ? r.statie[0] : r.statie;

    if (!client?.sms_optin || !client?.telefon || !statie) {
      await supabase
        .from("remindere")
        .update({ status: "eroare", eroare: "Client fara telefon sau SMS dezactivat" })
        .eq("id", r.id);
      erori++;
      continue;
    }

    const profileId = (statie as Record<string, unknown>).owner_id as string;
    if (!profileId) {
      erori++;
      continue;
    }

    // Stație oprită (marcarea în bloc a ratat reminderul) sau cont din trialul nou
    // rămas fără SMS mai devreme în rularea asta: același rezultat, fără trimitere.
    const oprireStatie = opriri.get(r.statie_id);
    const oprire = oprireStatie ?? faraSms.get(profileId);
    if (oprire) {
      await supabase
        .from("remindere")
        .update({ status: oprire.status, eroare: oprire.eroare })
        .eq("id", r.id);
      if (oprireStatie) oprite++;
      else erori++;
      continue;
    }

    const { data: tmpl } = await supabase
      .from("sms_templates")
      .select("mesaj")
      .or(`statie_id.eq.${r.statie_id},statie_id.is.null`)
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
      statieSlug: (statie as Record<string, unknown>).slug as string | null,
    });

    const mesajFinal = interpolateTemplate(templateText, vars);

    const result = await sendSms({
      telefon: client.telefon,
      mesaj: mesajFinal,
      profileId,
      statieId: r.statie_id,
      clientId: client.id,
    });

    if (result.success) {
      await supabase
        .from("remindere")
        .update({ status: "trimis", trimis: true, trimis_la: new Date().toISOString(), mesaj: mesajFinal, eroare: null })
        .eq("id", r.id);
      trimise++;
    } else {
      await supabase
        .from("remindere")
        .update({ status: "eroare", eroare: result.error ?? "Eroare necunoscuta" })
        .eq("id", r.id);
      if (result.quotaDepasita) {
        console.warn(`[CRON] Quota depășită pentru profile ${profileId}`);
        if (result.trialFaraSms) {
          faraSms.set(profileId, { status: "eroare", eroare: result.error ?? "Eroare necunoscuta" });
        }
      }
      erori++;
    }
  }

  return NextResponse.json({ generated, trimise, erori, amanate, total: lista.length, oprite, statiiOprite: opriri.size });
}
